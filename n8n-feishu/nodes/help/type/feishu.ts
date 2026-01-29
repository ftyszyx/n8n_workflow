export enum FeishuBitableFieldType {
  TEXT = 1,
  NUMBER = 2,
  BOOLEAN = 3,
  DATE = 4,
  DATETIME = 5,
  TIME = 6,
  SELECT = 7,
  MULTI_SELECT = 8,
  USER = 11,
  EMAIL = 13,
  PHONE = 15,
  URL = 17,
  FILE = 19,
  LINK = 21,
  LOCATION = 22,
  GROUP = 23,
}

export enum FeishuBitableFieldUiType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
}

export interface FeishuBitableFieldInfo {
  field_id: string;
  field_name: string;
  is_hidden: boolean;
  is_primary: boolean;
  type: FeishuBitableFieldType;
  ui_type: FeishuBitableFieldUiType;
}

export interface FeishuDocumentInfo {
  cover: {
    token: string;
  }
  document_id: string;
  title: string;
}

export interface FeishuWikiNodeInfo {
  creator: string;
  has_child: boolean;
  node_create_time: number;
  node_creator: string;
  node_token: string;//节点的 token
  node_type: string;//节点的类型
  obj_create_time: number;//节点的实际云文档的创建时间
  obj_edit_time: number;//节点的实际云文档的编辑时间
  obj_token: string;//节点的实际云文档的 token
  obj_type: string;//节点的实际云文档的类型
  space_id: string;
  title: string;
  owner: string;
}