// src/components/CodeEditor.jsx
import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';

const toolboxCategories = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      colour: '%{BKY_LOGIC_HUE}',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      colour: '%{BKY_LOOPS_HUE}',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      colour: '%{BKY_MATH_HUE}',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    {
      kind: 'category',
      name: 'Fable Blocks',
      colour: '180',
      contents: [
        // aici blocuri custom
      ],
    },
  ],
};

export default function CodeEditor() {
  const [xml, setXml] = useState('<xml xmlns="https://developers.google.com/blockly/xml"></xml>');

  return (
    <div className="h-full w-full">
      <BlocklyWorkspace
        toolboxConfiguration={toolboxCategories}
        initialXml={xml}
        className="w-full h-full"
        workspaceConfiguration={{}}
        onXmlChange={setXml}
      />
    </div>
  );
}
