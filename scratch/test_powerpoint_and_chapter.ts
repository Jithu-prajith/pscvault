import { LocalWorkspaceRepository } from '../src/infrastructure/repositories/LocalWorkspaceRepository';
import { LocalNotebookRepository } from '../src/infrastructure/repositories/LocalNotebookRepository';
import { LocalSectionRepository } from '../src/infrastructure/repositories/LocalSectionRepository';
import { LocalPageRepository } from '../src/infrastructure/repositories/LocalPageRepository';
import { LocalAttachmentRepository } from '../src/infrastructure/repositories/LocalAttachmentRepository';

const store: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; }
};

async function runPowerPointAndChapterTest() {
  console.log('====================================================');
  console.log('🧪 PSCVault POWERPOINT IMAGE & CHAPTER CONTAINER TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASSED: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`  ❌ FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  const userId = 'usr_powerpoint_chapter_test';
  const wsRepo = new LocalWorkspaceRepository();
  const nbRepo = new LocalNotebookRepository();
  const secRepo = new LocalSectionRepository();
  const pageRepo = new LocalPageRepository();
  const attRepo = new LocalAttachmentRepository();

  // 1. Setup Workspace & Hierarchy
  const ws = await wsRepo.create({ userId, name: 'PowerPoint & Chapter Test Workspace' });
  const nb = await nbRepo.create({ workspaceId: ws.id, name: 'GS I — Indian History', icon: '🏛️' });
  const secGrp = await secRepo.createGroup({ notebookId: nb.id, name: 'Ancient & Medieval', position: 'a0' });
  const secHistory = await secRepo.create({ notebookId: nb.id, sectionGroupId: secGrp.id, name: 'Ancient History', color: '#f59e0b' });

  // ----------------------------------------------------
  // PART 2: CHAPTER AS A CONTAINER & TOPIC AUTOMATION
  // ----------------------------------------------------
  console.log('--- PART 2: CHAPTER CONTAINER & TOPIC AUTOMATION TEST ---');

  // Create Chapter 1 Container
  const chap1 = await pageRepo.createChapter(secHistory.id, 'Ancient India');
  assert(chap1.type === 'chapter' && chap1.numbering === '1', 'Chapter 1 Container Created', chap1.title);

  // Subpages for Chapter 1 before adding topics
  const initialSubpages = await pageRepo.getSubpages(chap1.id);
  assert(initialSubpages.length === 0, 'Chapter 1 Initially Contains 0 Topics (Pure Container)');

  // Add Topic 1.1
  const topic1 = await pageRepo.createTopic(chap1.id, 'Indus Valley Civilization');
  assert(topic1.type === 'topic' && topic1.numbering === '1.1' && topic1.parentId === chap1.id, 'Topic 1.1 Autonumbered Created', topic1.title);

  // Add Topic 1.2
  const topic2 = await pageRepo.createTopic(chap1.id, 'Vedic Period');
  assert(topic2.type === 'topic' && topic2.numbering === '1.2' && topic2.parentId === chap1.id, 'Topic 1.2 Autonumbered Created', topic2.title);

  // Add Topic 1.3
  const topic3 = await pageRepo.createTopic(chap1.id, 'Mahajanapadas');
  assert(topic3.type === 'topic' && topic3.numbering === '1.3' && topic3.parentId === chap1.id, 'Topic 1.3 Autonumbered Created', topic3.title);

  // Subpages after adding topics
  const updatedSubpages = await pageRepo.getSubpages(chap1.id);
  assert(updatedSubpages.length === 3, 'Chapter 1 Container Subtopics List Count === 3');

  // Create Chapter 2 Container & Topic 2.1
  const chap2 = await pageRepo.createChapter(secHistory.id, 'Medieval India');
  assert(chap2.type === 'chapter' && chap2.numbering === '2', 'Chapter 2 Container Created', chap2.title);

  const topic2_1 = await pageRepo.createTopic(chap2.id, 'Delhi Sultanate');
  assert(topic2_1.type === 'topic' && topic2_1.numbering === '2.1' && topic2_1.parentId === chap2.id, 'Topic 2.1 Autonumbered under Chapter 2 Created', topic2_1.title);

  // ----------------------------------------------------
  // PART 1: POWERPOINT-STYLE IMAGE MANIPULATION TEST
  // ----------------------------------------------------
  console.log('\n--- PART 1: POWERPOINT-STYLE IMAGE MANIPULATION TEST ---');

  // Save Image Attachment
  const imgAtt = await attRepo.save({
    workspaceId: ws.id,
    pageId: topic1.id,
    originalFileName: 'Harappan_Seals_Archaeology.jpg',
    mimeType: 'image/jpeg',
    fileData: new Uint8Array([255, 216, 255, 224]),
    width: 800,
    height: 600,
  });

  // Construct PowerPoint-Style TipTap Image Block Document Node
  const powerPointImageDoc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Pashupati Seal and Indus Valley Script findings:' }]
      },
      {
        type: 'imageBlock',
        attrs: {
          attachmentId: imgAtt.id,
          storagePath: imgAtt.storagePath,
          src: imgAtt.storagePath,
          alt: 'Harappan Pashupati Seal',
          title: 'Harappan Pashupati Seal',
          width: 1200,             // Stretched horizontally
          height: 600,              // Height preserved independently
          rotation: 45,             // 45 degrees rotated
          alignment: 'center',
          zIndex: 3,                // Z-index layering
          locked: false,
          aspectRatioLocked: false, // Freeform stretching enabled
          annotations: [],
        }
      }
    ]
  };

  // Write PowerPoint note content to Topic 1.1
  await pageRepo.updateContent(topic1.id, powerPointImageDoc);

  // Read Topic 1.1 and verify independent attributes persistence
  const savedTopic1 = await pageRepo.getById(topic1.id);
  const savedDoc = savedTopic1?.content as any;
  const imageNode = savedDoc.content[1];

  assert(imageNode.type === 'imageBlock', 'Image Block Node Saved in Topic 1.1');
  assert(imageNode.attrs.width === 1200 && imageNode.attrs.height === 600, 'Independent Width (1200px) & Height (600px) Saved', `Width: ${imageNode.attrs.width}, Height: ${imageNode.attrs.height}`);
  assert(imageNode.attrs.rotation === 45, 'Rotation Angle (45°) Saved');
  assert(imageNode.attrs.aspectRatioLocked === false, 'Aspect Ratio Unlock (Freeform Stretching) Saved');
  assert(imageNode.attrs.zIndex === 3, 'Z-Index Layering (3) Saved');

  // Test updating vertical height independently (800 x 1000)
  const verticalStretchedDoc = {
    ...powerPointImageDoc,
    content: [
      powerPointImageDoc.content[0],
      {
        ...imageNode,
        attrs: {
          ...imageNode.attrs,
          width: 800,
          height: 1000, // Vertically elongated
          rotation: 90, // Rotated 90 degrees
        }
      }
    ]
  };

  await pageRepo.updateContent(topic1.id, verticalStretchedDoc);
  const reloadedTopic = await pageRepo.getById(topic1.id);
  const reloadedImageNode = (reloadedTopic?.content as any).content[1];

  assert(reloadedImageNode.attrs.width === 800 && reloadedImageNode.attrs.height === 1000, 'Vertical Stretching Saved (Width: 800px, Height: 1000px)');
  assert(reloadedImageNode.attrs.rotation === 90, 'Rotated 90° Saved');

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL POWERPOINT IMAGE & CHAPTER CONTAINER TESTS PASSED 100%!');
    process.exit(0);
  } else {
    console.error('❌ POWERPOINT IMAGE & CHAPTER CONTAINER TEST FAILED.');
    process.exit(1);
  }
}

runPowerPointAndChapterTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
