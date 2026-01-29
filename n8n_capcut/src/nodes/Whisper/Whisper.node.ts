import {spawn} from 'child_process';
import * as fs from 'fs';
import type {IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription} from 'n8n-workflow';
import * as os from 'os';
import * as path from 'path';

type ChildOutput = string|Buffer;
function parseArgs(s: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray|null;
  while ((m = re.exec(s)) !== null) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}
function runCommand(command: string, args: string[]):
    Promise<{stdout: string; stderr: string; exitCode: number}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {windowsHide: true});
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: ChildOutput) => (stdout += d.toString()));
    child.stderr.on('data', (d: ChildOutput) => (stderr += d.toString()));
    child.on('error', reject);
    child.on(
        'close',
        (code: number|null) => resolve({stdout, stderr, exitCode: code ?? -1}));
  });
}
function guessExt(fileName?: string, mimeType?: string): string {
  const n = (fileName || '').toLowerCase();
  const m = (mimeType || '').toLowerCase();
  const fromName = n.includes('.') ? n.split('.').pop() || '' : '';
  if (fromName) return fromName;
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('m4a')) return 'm4a';
  if (m.includes('ogg')) return 'ogg';
  return 'wav';
}
export class Whisper implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Whisper (Local)',
    name: 'whisperLocal',
    icon: 'file:whisper.svg',
    group: ['transform'],
    version: 1,
    description:
        'Transcribe audio to text using a local Whisper CLI (e.g. whisper.cpp)',
    defaults: {name: 'Whisper (Local)'},
    inputs: ['main'],
    outputs: ['main'],
    properties:
        [
          {
            displayName: 'Binary Property',
            name: 'binaryProperty',
            type: 'string',
            default: 'data',
            required: true,
            description: 'Binary property name containing the audio (e.g. data)'
          },
          {
            displayName: 'Whisper Binary',
            name: 'whisperPath',
            type: 'string',
            default: 'whisper-cli',
            required: true,
            description:
                'Executable name or full path (e.g. whisper-cli.exe or main.exe)'
          },
          {
            displayName: 'Model Path',
            name: 'modelPath',
            type: 'string',
            default: '',
            required: true,
            description:
                'Path to ggml/gguf model file (e.g. D:\\models\\ggml-base.bin)'
          },
          {
            displayName: 'Language',
            name: 'language',
            type: 'string',
            default: '',
            description:
                'Optional language code for whisper.cpp -l (e.g. zh, en). Leave empty for auto'
          },
          {
            displayName: 'Threads',
            name: 'threads',
            type: 'number',
            default: 4,
            typeOptions: {minValue: 1}
          },
          {
            displayName: 'Additional Arguments',
            name: 'additionalArgs',
            type: 'string',
            default: '',
            description:
                'Extra CLI args appended at the end (supports quotes), e.g. -pp "prompt text"'
          },
          {
            displayName: 'Keep Temp Files',
            name: 'keepTemp',
            type: 'boolean',
            default: false
          },
          {
            displayName: 'Include Stdout/Stderr',
            name: 'includeLogs',
            type: 'boolean',
            default: false
          },
        ],
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const binaryProperty =
          this.getNodeParameter('binaryProperty', itemIndex) as string;
      const whisperPath =
          this.getNodeParameter('whisperPath', itemIndex) as string;
      const modelPath = this.getNodeParameter('modelPath', itemIndex) as string;
      const language = this.getNodeParameter('language', itemIndex) as string;
      const threads = this.getNodeParameter('threads', itemIndex) as number;
      const additionalArgs =
          this.getNodeParameter('additionalArgs', itemIndex) as string;
      const keepTemp = this.getNodeParameter('keepTemp', itemIndex) as boolean;
      const includeLogs =
          this.getNodeParameter('includeLogs', itemIndex) as boolean;
      const bin = items[itemIndex].binary?.[binaryProperty];
      if (!bin?.data)
        throw new Error(`Missing binary data at binary.${binaryProperty}`);
      const buf = Buffer.from(bin.data, 'base64');
      const ext = guessExt(bin.fileName, bin.mimeType);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-whisper-'));
      const inputPath = path.join(tmpDir, `input.${ext}`);
      const outBase = path.join(tmpDir, 'out');
      const outTxt = `${outBase}.txt`;
      try {
        fs.writeFileSync(inputPath, buf);
        const args: string[] = [
          '-m', modelPath, '-f', inputPath, '-otxt', '-of', outBase, '-t',
          String(threads)
        ];
        if (language && language.trim()) args.push('-l', language.trim());
        if (additionalArgs && additionalArgs.trim())
          args.push(...parseArgs(additionalArgs.trim()));
        const res = await runCommand(whisperPath, args);
        let text = '';
        if (fs.existsSync(outTxt))
          text = fs.readFileSync(outTxt, 'utf8');
        else
          text = res.stdout;
        if (res.exitCode !== 0)
          throw new Error(`Whisper failed (exitCode=${res.exitCode}): ${
              res.stderr || res.stdout}`);
        returnData.push({
          json: {
            text: (text || '').trim(),
            modelPath,
            language: language || undefined,
            inputExt: ext,
            tempDir: keepTemp ? tmpDir : undefined,
            stdout: includeLogs ? res.stdout : undefined,
            stderr: includeLogs ? res.stderr : undefined
          }
        });
      } finally {
        if (!keepTemp) {
          try {
            fs.rmSync(tmpDir, {recursive: true, force: true});
          } catch { /* ignore */
          }
        }
      }
    }
    return [returnData];
  }
}
