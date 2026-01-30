import type {INodeProperties} from 'n8n-workflow';
export const customScriptProperties: INodeProperties[] = [
  {
    displayName: 'Script Code',
    name: 'scriptCode',
    type: 'string',
    typeOptions: {editor: 'codeNodeEditor', editorLanguage: 'javaScript'},
    required: true,
    default:
        `// Navigate to a URL\nawait $page.goto('https://example.com');\n\n// Get page title\nconst title = await $page.title();\nconsole.log('Page title:', title);\n\n// Take a screenshot\nconst screenshot = await $page.screenshot({ type: 'png' });\n\n// Return results\nreturn [{\n    json: { \n        title,\n        url: $page.url()\n    },\n    binary: {\n        screenshot: await $helpers.prepareBinaryData(\n            Buffer.from(screenshot),\n            'screenshot.png',\n            'image/png'\n        )\n    }\n}];`,
    description:
        'JavaScript code to execute with Playwright. Access $page, $browser, $playwright, and all n8n Code node variables.',
    noDataExpression: true,
    displayOptions: {show: {operation: ['runCustomScript']}}
  },
  {
    displayName:
        'Use <code>$page</code>, <code>$browser</code>, or <code>$playwright</code> to access Playwright. <a target="_blank" href="https://docs.n8n.io/code-examples/methods-variables-reference/">Special vars/methods</a> are available. <br><br>Debug by using <code>console.log()</code> statements and viewing their output in the browser console.',
    name: 'notice',
    type: 'notice',
    displayOptions: {show: {operation: ['runCustomScript']}},
    default: ''
  }
];
