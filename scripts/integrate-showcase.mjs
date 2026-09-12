import {readFile,writeFile} from 'node:fs/promises';
const file='src/demos.jsx';let text=await readFile(file,'utf8');
const start=text.indexOf('export function TabletStage('),end=text.indexOf('export function FlowDiagram(',start);
if(start<0||end<0)throw new Error('TabletStage boundaries not found');
text=text.slice(0,start)+'export function TabletStage(props) {\n  return <ShowcaseTablet {...props} />;\n}\n\n'+text.slice(end);
text=text.replace('import { categories, projects } from "./content";', 'import { categories, projects } from "./content";\nimport { ShowcaseTablet } from "./tablet-showcase";\nimport { ShowcaseImage, ShowcaseExperience } from "./showcase";\nimport { showcaseIds } from "./showcase-content";');
text=text.replace('export function ProjectVisual({ id, interactive = false, mini = false }) {','export function ProjectVisual({ id, interactive = false, mini = false }) {\n  if (showcaseIds.has(id)) return interactive ? <ShowcaseExperience id={id} /> : <ShowcaseImage id={id} />;');
text=text.replace('  return <QuestionDemo interactive={interactive} />;\n}', '  if (id === "question") return <QuestionDemo interactive={interactive} />;\n  return null;\n}');
await writeFile(file,text);
