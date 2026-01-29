import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodePropertyTypeOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { spawn } from 'child_process';
import * as path from 'path';

type ChildOutput = string | Buffer;

function runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }>
{
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { windowsHide: true });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (d: ChildOutput) => (stdout += d.toString()));
		child.stderr.on('data', (d: ChildOutput) => (stderr += d.toString()));
		child.on('error', reject);
		child.on('close', (code: number | null) => {
			resolve({ stdout, stderr, exitCode: code ?? -1 });
		});
	});
}

function defaultOutputPath(inputPath: string, ext: string): string {
	const dir = path.dirname(inputPath);
	const base = path.basename(inputPath, path.extname(inputPath));
	return path.join(dir, `${base}${ext}`);
}

export class FfmpegExtractAudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FFmpeg Extract Audio',
		name: 'ffmpegExtractAudio',
		icon: 'file:ffmpeg.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract audio from a local video file using ffmpeg',
		defaults: {
			name: 'FFmpeg Extract Audio',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Video Path',
				name: 'inputPath',
				type: 'string',
				default: '',
				required: true,
				description: 'Local file path to the video (e.g. D:\\tmp\\video.mp4)',
			},
			{
				displayName: 'Output Audio Path',
				name: 'outputPath',
				type: 'string',
				default: '',
				description: 'Local file path to write audio. Leave empty to write <input>.mp3',
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'mp3',
				options: [
					{ name: 'MP3', value: 'mp3' },
				],
			},
			{
				displayName: 'Overwrite Output',
				name: 'overwrite',
				type: 'boolean',
				default: true,
			},
			{
				displayName: 'MP3 Quality (q:a)',
				name: 'mp3Quality',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 0, maxValue: 9 } as INodePropertyTypeOptions,
				description: 'ffmpeg -q:a value, lower is better quality (0-9)',
				displayOptions: {
					show: {
						format: ['mp3'],
					},
				},
			},
			{
				displayName: 'FFmpeg Binary',
				name: 'ffmpegPath',
				type: 'string',
				default: 'ffmpeg',
				description: 'ffmpeg executable name or full path',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const inputPath = this.getNodeParameter('inputPath', itemIndex) as string;
			const outputPathParam = this.getNodeParameter('outputPath', itemIndex) as string;
			const format = this.getNodeParameter('format', itemIndex) as string;
			const overwrite = this.getNodeParameter('overwrite', itemIndex) as boolean;
			const ffmpegPath = this.getNodeParameter('ffmpegPath', itemIndex) as string;

			let outputPath = outputPathParam;
			if (!outputPath) {
				outputPath = defaultOutputPath(inputPath, format === 'mp3' ? '.mp3' : '.audio');
			}

			const args: string[] = [];
			args.push(overwrite ? '-y' : '-n');
			args.push('-i', inputPath);
			args.push('-vn');

			if (format === 'mp3') {
				const mp3Quality = this.getNodeParameter('mp3Quality', itemIndex) as number;
				args.push('-acodec', 'libmp3lame');
				args.push('-q:a', String(mp3Quality));
			}

			args.push(outputPath);

			const res = await runCommand(ffmpegPath, args);
			if (res.exitCode !== 0) {
				throw new Error(`ffmpeg failed (exitCode=${res.exitCode}): ${res.stderr || res.stdout}`);
			}

			returnData.push({
				json: {
					inputPath,
					outputPath,
					format,
				},
			});
		}

		return [returnData];
	}
}
