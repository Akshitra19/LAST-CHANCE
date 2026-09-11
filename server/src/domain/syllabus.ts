export type SyllabusTopicRow = {
  id: string;
  subject_id: string;
  parent_topic_id: string | null;
  code: string;
  name: string;
  preparation_status: string;
  display_order: number;
  is_official: boolean;
  syllabus_version: string;
};

export type SyllabusTopicNode = {
  id: string;
  code: string;
  name: string;
  status: string;
  parentTopicId: string | null;
  depth: number;
  displayOrder: number;
  isOfficial: boolean;
  leafCount: number;
  masteredLeafCount: number;
  weakLeafCount: number;
  children: SyllabusTopicNode[];
};

export class SyllabusGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyllabusGraphError';
  }
}

const invalid = (message: string): never => { throw new SyllabusGraphError(message); };
const compareTopics = (a: SyllabusTopicNode, b: SyllabusTopicNode): number => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code);

export function validateSyllabusGraph(rows: readonly SyllabusTopicRow[], subjectIds: ReadonlySet<string>): void {
  if (new Set(rows.map((row) => row.code)).size !== rows.length) invalid('Syllabus topic codes are duplicated.');
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const row of rows) {
    if (!subjectIds.has(row.subject_id)) invalid(`Topic ${row.code} has a missing subject.`);
    if (!row.is_official && row.parent_topic_id === null) invalid(`Preparation topic ${row.code} cannot be a root.`);
    if (row.parent_topic_id) {
      const parent = byId.get(row.parent_topic_id);
      if (!parent) throw new SyllabusGraphError(`Topic ${row.code} has a missing parent.`);
      if (parent.subject_id !== row.subject_id) invalid(`Topic ${row.code} has a cross-subject parent.`);
      if (parent.syllabus_version !== row.syllabus_version) invalid(`Topic ${row.code} has a cross-version parent.`);
    }
  }
  for (const row of rows) {
    const seen = new Set<string>();
    let current: SyllabusTopicRow | undefined = row;
    while (current) {
      if (seen.has(current.id)) invalid(`Topic ${row.code} is part of a hierarchy cycle.`);
      seen.add(current.id);
      current = current.parent_topic_id ? byId.get(current.parent_topic_id) : undefined;
    }
  }
}

function finalize(node: SyllabusTopicNode, ancestors: ReadonlySet<string>, depth: number): void {
  if (ancestors.has(node.id)) invalid(`Topic ${node.code} is part of a hierarchy cycle.`);
  node.depth = depth;
  node.children.sort(compareTopics);
  if (node.children.length === 0) {
    node.leafCount = 1;
    node.masteredLeafCount = node.status === 'MASTERED' ? 1 : 0;
    node.weakLeafCount = node.status === 'WEAK' ? 1 : 0;
    return;
  }
  const next = new Set(ancestors);
  next.add(node.id);
  node.children.forEach((child) => finalize(child, next, depth + 1));
  node.leafCount = node.children.reduce((sum, child) => sum + child.leafCount, 0);
  node.masteredLeafCount = node.children.reduce((sum, child) => sum + child.masteredLeafCount, 0);
  node.weakLeafCount = node.children.reduce((sum, child) => sum + child.weakLeafCount, 0);
  node.status = node.masteredLeafCount === node.leafCount ? 'MASTERED' : node.weakLeafCount > 0 ? 'WEAK' : node.masteredLeafCount > 0 ? 'LEARNING' : 'NOT_STARTED';
}

export function buildSubjectHierarchy(rows: readonly SyllabusTopicRow[], subjectId: string): SyllabusTopicNode[] {
  const subjectRows = rows.filter((row) => row.subject_id === subjectId);
  const nodes = new Map<string, SyllabusTopicNode>(subjectRows.map((row) => [row.id, {
    id: row.id, code: row.code, name: row.name, status: row.preparation_status,
    parentTopicId: row.parent_topic_id, depth: 0, displayOrder: row.display_order,
    isOfficial: row.is_official, leafCount: 0, masteredLeafCount: 0, weakLeafCount: 0, children: []
  } as SyllabusTopicNode]));
  const roots: SyllabusTopicNode[] = [];
  for (const row of subjectRows) {
    const node = nodes.get(row.id)!;
    if (row.parent_topic_id === null) roots.push(node);
    else nodes.get(row.parent_topic_id)?.children.push(node);
  }
  roots.sort(compareTopics);
  roots.forEach((root) => finalize(root, new Set(), 0));
  const reachable = new Set<string>();
  const visit = (node: SyllabusTopicNode): void => { reachable.add(node.id); node.children.forEach(visit); };
  roots.forEach(visit);
  if (reachable.size !== subjectRows.length) invalid('A syllabus topic is not connected to a root.');
  return roots;
}

export function actionableLeafRows<T extends Pick<SyllabusTopicRow, 'id' | 'parent_topic_id'>>(rows: readonly T[]): T[] {
  const parentIds = new Set(rows.flatMap((row) => row.parent_topic_id ? [row.parent_topic_id] : []));
  return rows.filter((row) => !parentIds.has(row.id));
}
