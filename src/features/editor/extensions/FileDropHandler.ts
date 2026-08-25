import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { saveAttachmentFile, classifyMediaType } from '../../../infrastructure/fs/fileService';

export const FileDropHandler = Extension.create({
  name: 'fileDropHandler',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('fileDropHandler'),
        props: {
          handleDOMEvents: {
            drop: (view, event) => {
              const files = event.dataTransfer?.files;
              if (!files || files.length === 0) return false;

              event.preventDefault();
              event.stopPropagation();

              Array.from(files).forEach(async (file) => {
                const mediaType = classifyMediaType(file.type);
                const data = new Uint8Array(await file.arrayBuffer());

                const saved = await saveAttachmentFile(data, file.name, mediaType);

                switch (mediaType) {
                  case 'image':
                    editor.chain().focus().insertContent({
                      type: 'imageBlock',
                      attrs: { src: saved.assetUrl, storagePath: saved.storagePath, alt: file.name },
                    }).run();
                    break;
                  case 'pdf':
                    editor.chain().focus().insertContent({
                      type: 'pdfBlock',
                      attrs: { src: saved.assetUrl, storagePath: saved.storagePath, fileName: file.name, fileSize: data.byteLength },
                    }).run();
                    break;
                  case 'audio':
                    editor.chain().focus().insertContent({
                      type: 'audioBlock',
                      attrs: { src: saved.assetUrl, storagePath: saved.storagePath, fileName: file.name, fileSize: data.byteLength },
                    }).run();
                    break;
                  default:
                    editor.chain().focus().insertContent({
                      type: 'fileBlock',
                      attrs: { src: saved.assetUrl, storagePath: saved.storagePath, fileName: file.name, fileSize: data.byteLength, mimeType: file.type, mediaType },
                    }).run();
                }
              });

              return true;
            },
          },
        },
      }),
    ];
  },
});
