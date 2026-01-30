import type {INodeProperties} from 'n8n-workflow';

import {browserProperties} from './browser';
import {captureNetworkProperties} from './captureNetwork';
import {customScriptProperties} from './customScript';
import {operationProperty} from './operation';
import {screenshotProperties} from './screenshot';
import {selectorProperties} from './selectors';
import {urlProperty} from './url';

export const playwrightProperties: INodeProperties[] = [
  ...operationProperty, ...urlProperty, ...captureNetworkProperties,
  ...customScriptProperties, ...screenshotProperties, ...selectorProperties,
  ...browserProperties
];
