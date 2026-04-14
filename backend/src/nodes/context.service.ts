import { Injectable } from "@nestjs/common";

import { Neo4jService } from "../neo4j/neo4j.service";

export interface UpdateContextPayload {
  note?: string;
  selectedText?: string;
  saveReason?: string;
  tags?: string[];
}

interface TagInput {
  name: string;
  slug: string;
}

const slugifyTagName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildContextProperties = (
  payload: UpdateContextPayload
): Record<string, string> => {
  const props: Record<string, string> = {};

  if (payload.note !== undefined) {
    props.note = payload.note;
  }

  if (payload.selectedText !== undefined) {
    props.selectedText = payload.selectedText;
  }

  if (payload.saveReason !== undefined) {
    props.saveReason = payload.saveReason;
  }

  return props;
};

const buildTagInputs = (tagNames: string[]): TagInput[] =>
  tagNames
    .map((name) => ({ name: name.trim(), slug: slugifyTagName(name) }))
    .filter((tag) => tag.name.length > 0 && tag.slug.length > 0);

@Injectable()
export class ContextService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async updateContext(
    id: string,
    payload: UpdateContextPayload
  ): Promise<Record<string, unknown> | null> {
    const props = buildContextProperties(payload);

    await this.neo4jService.write(
      "MATCH (n) WHERE elementId(n) = $id SET n += $props",
      { id, props }
    );

    if (payload.tags !== undefined) {
      await this.reconcileTags(id, payload.tags);
    }

    const result = await this.neo4jService.read(
      "MATCH (n) WHERE elementId(n) = $id RETURN properties(n) AS node LIMIT 1",
      { id }
    );
    const record = result.records[0];

    if (record === undefined) {
      return null;
    }

    return record.get("node") as Record<string, unknown>;
  }

  private async reconcileTags(id: string, tagNames: string[]): Promise<void> {
    const tags = buildTagInputs(tagNames);
    const slugs = tags.map((tag) => tag.slug);
    const createdAt = new Date().toISOString();

    await this.neo4jService.write(
      "MATCH (n) WHERE elementId(n) = $id OPTIONAL MATCH (n)-[r:TAGGED_WITH]->(tag:Tag) WHERE NOT tag.slug IN $slugs DELETE r",
      { id, slugs }
    );

    await this.neo4jService.write(
      "MATCH (n) WHERE elementId(n) = $id UNWIND $tags AS tagInput MERGE (tag:Tag {slug: tagInput.slug}) ON CREATE SET tag.name = tagInput.name, tag.slug = tagInput.slug, tag.createdAt = $createdAt ON MATCH SET tag.name = tagInput.name MERGE (n)-[r:TAGGED_WITH]->(tag) ON CREATE SET r.createdAt = $createdAt SET r.source = 'user'",
      { id, tags, createdAt }
    );
  }
}
