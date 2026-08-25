import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AudioBlockView } from './AudioBlockView';

export const AudioBlock = Node.create({
  name: 'audioBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      attachmentId:    { default: null },
      storagePath:     { default: null },
      src:             { default: null },
      fileName:        { default: 'Audio Recording.webm' },
      fileSize:        { default: 0 },
      duration:        { default: 0 },
      isRecordingMode: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'audio-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioBlockView);
  },
});
