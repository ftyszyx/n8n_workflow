import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { ResourceOperations } from '../../../help/type/IResource';
import { docxBlocksToMarkdown } from '../../../help/utils/DocxMarkdownRenderer';
import type { CommonBlock } from '../../../help/utils/feishu_docx/types';
import { getFileNameFromBlock } from './utils/docx';
import { getAllBlocks, GetDocumentInfo, GetNodeInfo } from './utils/docx';

export default {
  name: '解析 Docx 为 Markdown',
  value: 'docxMarkdown:parse',
  order: 100,
  options:
    [
      {
        displayName: '文档 ID',
        name: 'document_id',
        type: 'string',
        required: true,
        default: '',
        description:
          'Docx 文档的 document_id（通常等于 wiki node 的 obj_token）',
      },
    ],
  async call(this: IExecuteFunctions, index: number):
    Promise<IDataObject> {

    const documentId =
      this.getNodeParameter('document_id', index) as string;
    const blocks = await getAllBlocks.call(this, documentId);
    const documentInfo = await GetDocumentInfo.call(this, documentId);
    const nodeInfo = await GetNodeInfo.call(this, documentId);
    const renderInput = { document: { document_id: documentId }, blocks };

    const rendered = docxBlocksToMarkdown(renderInput as any);
    const markdown = (rendered as any)?.markdown || '';

    const fileTokens = rendered.fileTokens;

    try {
      const files =
        Object.values(fileTokens).map((fileToken: CommonBlock) => {
          const fileName = getFileNameFromBlock(fileToken);
          const ossObjectKey = `feishu-docx/${documentId}/${fileName}`;
          return { token: fileToken.block.token, fileName, ossObjectKey };
        });

      return {
        document_id: documentId,
        markdown,
        files,
        cover: documentInfo.cover,
        title: documentInfo.title,
        create_time: nodeInfo.obj_create_time,
        update_time: nodeInfo.obj_edit_time,
        rendered,
      };
    } catch (e) {
      throw new NodeOperationError(
        this.getNode(), `解析 Docx 为 Markdown 失败: ${e.message}`,
        { itemIndex: index });
    }
  },
} as ResourceOperations;
