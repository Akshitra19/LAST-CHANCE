export type TopicPathRow = { id: string; name: string; parent_topic_id: string | null };

export function buildTopicPath(topic: TopicPathRow, subjectName: string, topics: ReadonlyMap<string, TopicPathRow>): string {
  const names: string[] = [];
  const seen = new Set<string>();
  let current: TopicPathRow | undefined = topic;
  while (current) {
    if (seen.has(current.id)) throw new Error('Task topic hierarchy contains a cycle.');
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parent_topic_id ? topics.get(current.parent_topic_id) : undefined;
  }
  return [subjectName, ...names].join(' › ');
}
