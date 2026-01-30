import { spawn } from 'child_process';
import * as fs from 'fs';
import { console } from 'inspector';
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import * as os from 'os';
import * as path from 'path';
type ChildOutput = string | Buffer;
function parseArgs(s: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}
function runCommand(command: string, args: string[], onStdout?: (s: string) => void, onStderr?: (s: string) => void):
  Promise<{ stdout: string; stderr: string; exitCode: number }> {
  console.log('runCommand', command, 'args', args.join(' '));
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: ChildOutput) => { const s = d.toString(); stdout += s; if (onStdout) onStdout(s); });
    child.stderr.on('data', (d: ChildOutput) => { const s = d.toString(); stderr += s; if (onStderr) onStderr(s); });
    child.on('error', reject);
    child.on('close', (code: number | null) => resolve({ stdout, stderr, exitCode: code ?? -1 }));
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
      'Transcribe audio to text using faster-whisper (Python)',
    defaults: { name: 'Whisper (Local)' },
    inputs: ['main'],
    outputs: ['main'],
    properties:
      [
        {
          displayName: 'Input Audio Path',
          name: 'inputPath',
          type: 'string',
          default: '',
          required: true,
          description: 'Local audio file path (e.g. D:\\\\tmp\\\\audio.mp3)'
        },
        {
          displayName: 'Python Path',
          name: 'pythonPath',
          type: 'string',
          default: 'python',
          required: true,
          description:
            'Python executable name or full path (requires Python 3.9+)'
        },
        {
          displayName: 'Model',
          name: 'model',
          type: 'string',
          default: 'small',
          required: true,
          description:
            'Model name (tiny/base/small/medium/large-v3/turbo) or a local CTranslate2 model directory'
        },
        {
          displayName: 'Device',
          name: 'device',
          type: 'options',
          default: 'cpu',
          options: [
            { name: 'CPU', value: 'cpu' },
            { name: 'CUDA', value: 'cuda' },
            { name: 'Auto', value: 'auto' },
          ],
          description: 'Inference device'
        },
        {
          displayName: 'Compute Type',
          name: 'computeType',
          type: 'options',
          default: 'int8',
          options: [
            { name: 'int8 (CPU推荐)', value: 'int8' },
            { name: 'float16 (GPU推荐)', value: 'float16' },
            { name: 'int8_float16', value: 'int8_float16' },
            { name: 'float32', value: 'float32' },
            { name: 'auto', value: 'auto' },
          ],
          description: 'CTranslate2 compute type'
        },
        {
          displayName: 'Language',
          name: 'language',
          type: 'options',
          default: '',
          options: [
            { name: 'Auto', value: '' },
            { name: 'Chinese (zh)', value: 'zh' },
            { name: 'English (en)', value: 'en' },
            { name: 'Japanese (ja)', value: 'ja' },
            { name: 'Korean (ko)', value: 'ko' },
            { name: 'French (fr)', value: 'fr' },
            { name: 'German (de)', value: 'de' },
            { name: 'Spanish (es)', value: 'es' },
            { name: 'Russian (ru)', value: 'ru' },
          ],
          description:
            'Optional language code (e.g. zh, en). Leave empty for auto'
        },
        {
          displayName: 'Beam Size',
          name: 'beamSize',
          type: 'number',
          default: 5,
          typeOptions: { minValue: 1 },
          description: '解码 beam size,越大越准确,越大越慢,推荐5-10'
        },
        {
          displayName: 'VAD Filter',
          name: 'vadFilter',
          type: 'boolean',
          default: false,
          description: '过滤静音/非语音'
        },
        {
          displayName: 'Additional Arguments',
          name: 'additionalArgs',
          type: 'string',
          default: '',
          description:
            'Extra args appended to runner (supports quotes), e.g. --task translate'
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
      const inputPath = this.getNodeParameter('inputPath', itemIndex) as string;
      const pythonPath = this.getNodeParameter('pythonPath', itemIndex) as string;
      const model = this.getNodeParameter('model', itemIndex) as string;
      const device = this.getNodeParameter('device', itemIndex) as string;
      const computeType = this.getNodeParameter('computeType', itemIndex) as string;
      const language = this.getNodeParameter('language', itemIndex) as string;
      const beamSize = this.getNodeParameter('beamSize', itemIndex) as number;
      const vadFilter = this.getNodeParameter('vadFilter', itemIndex) as boolean;
      const additionalArgs =
        this.getNodeParameter('additionalArgs', itemIndex) as string;
      const keepTemp = this.getNodeParameter('keepTemp', itemIndex) as boolean;
      const includeLogs =
        this.getNodeParameter('includeLogs', itemIndex) as boolean;
      const logger = (this as any).logger;
      const logInfo = (m: string) => { try { if (includeLogs && logger?.info) logger.info(m); else if (includeLogs) console.log(m); } catch { } };
      const logDebug = (m: string) => { try { if (includeLogs && logger?.debug) logger.debug(m); else if (includeLogs) console.log(m); } catch { } };
      if (!inputPath || !inputPath.trim()) throw new Error('Input Audio Path is required');
      if (!fs.existsSync(inputPath)) throw new Error(`Input audio file not found: ${inputPath}`);
      const ext = path.extname(inputPath).replace('.', '').toLowerCase() || 'audio';
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'n8n-whisper-'));
      const runnerPath = path.join(tmpDir, 'runner.py');
      try {
        logInfo(`[whisper] start item=${itemIndex} input=${inputPath} model=${model} device=${device} computeType=${computeType} language=${language || 'auto'} beamSize=${beamSize} vadFilter=${vadFilter}`);
        fs.writeFileSync(runnerPath, [
          'import argparse,json,sys',
          'import ctranslate2',
          'from faster_whisper import WhisperModel',
          'try:',
          '  sys.stdout.reconfigure(encoding="utf-8")',
          '  sys.stderr.reconfigure(encoding="utf-8")',
          'except Exception:',
          '  pass',
          'p=argparse.ArgumentParser()',
          'p.add_argument("--audio",required=True)',
          'p.add_argument("--model",required=True)',
          'p.add_argument("--device",default="cpu")',
          'p.add_argument("--compute_type",default="int8")',
          'p.add_argument("--language",default="")',
          'p.add_argument("--beam_size",type=int,default=5)',
          'p.add_argument("--vad_filter",action="store_true")',
          'p.add_argument("--task",default="transcribe")',
          'a=p.parse_args()',
          'device=a.device',
          'if device=="auto": device="cuda" if ctranslate2.get_cuda_device_count()>0 else "cpu"',
          'compute_type=a.compute_type',
          'if compute_type=="auto": compute_type="default"',
          'm=WhisperModel(a.model,device=device,compute_type=compute_type)',
          'segments,info=m.transcribe(a.audio,language=a.language or None,beam_size=a.beam_size,vad_filter=a.vad_filter,task=a.task)',
          'segs=list(segments)',
          'segments_out=[{"index":i,"start":float(s.start),"end":float(s.end),"text":(s.text or "").strip()} for i,s in enumerate(segs)]',
          'text="\\n".join([s["text"] for s in segments_out if s.get("text")]).strip()',
          'out={"text":text,"segments":segments_out,"language":getattr(info,"language",None),"language_probability":getattr(info,"language_probability",None)}',
          'sys.stdout.write(json.dumps(out,ensure_ascii=False))',
        ].join('\n'), { encoding: 'utf8' });
        const args: string[] = [
          '-u',
          '-X',
          'utf8',
          runnerPath,
          '--audio', inputPath,
          '--model', model,
          '--device', device,
          '--compute_type', computeType,
          '--beam_size', String(beamSize),
        ];
        if (language && language.trim()) args.push('--language', language.trim());
        if (vadFilter) args.push('--vad_filter');
        if (additionalArgs && additionalArgs.trim()) args.push(...parseArgs(additionalArgs.trim()));
        logInfo(`[whisper] exec: ${pythonPath} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
        const res = await runCommand(pythonPath, args, (s) => logDebug(`[whisper][stdout] ${s.replace(/\r?\n$/, '')}`), (s) => logDebug(`[whisper][stderr] ${s.replace(/\r?\n$/, '')}`));
        if (res.exitCode !== 0) throw new Error(`faster-whisper failed (exitCode=${res.exitCode}): ${res.stderr || res.stdout}`);
        let parsed: any;
        try { parsed = JSON.parse(res.stdout.trim()); } catch { throw new Error(`faster-whisper returned non-JSON stdout: ${res.stdout || res.stderr}`); }
        logInfo(`[whisper] done item=${itemIndex} textLen=${String((parsed?.text || '').length)} detectedLanguage=${parsed?.language || ''}`);
        returnData.push({
          json: {
            text: (parsed?.text || '').trim(),
            detectedLanguage: parsed?.language || undefined,
            languageProbability: parsed?.language_probability ?? undefined,
            segments: parsed?.segments ?? undefined,
            model,
            device,
            computeType,
            requestedLanguage: language || undefined,
            inputExt: ext,
            tempDir: keepTemp ? tmpDir : undefined,
            stdout: includeLogs ? res.stdout : undefined,
            stderr: includeLogs ? res.stderr : undefined
          }
        });
      } finally {
        if (!keepTemp) {
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch { /* ignore */
          }
        }
      }
    }
    return [returnData];
  }
}
