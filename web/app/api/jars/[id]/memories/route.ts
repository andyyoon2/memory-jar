import * as uuid from 'uuid';
import { DynamoDBClient, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AttributeValue as attr, updateExpr } from 'dynamodb-data-types';
import { JAR_PREFIX, MEMORY_PREFIX, USER_PREFIX } from '@/app/api/utils';

const client = new DynamoDBClient({});

// Get all memories in this jar (by UUID order)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const jarId = `${JAR_PREFIX}${params.id}`;

  const ExpressionAttributeValues = attr.wrap({
    ":jarId": jarId,
    ":memoryPrefix": MEMORY_PREFIX,
  });

  const { Items: memoryRecords } = await client.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :jarId and begins_with(SK, :memoryPrefix)",
      ExpressionAttributeValues,
      ProjectionExpression: "SK, mText, mAuthorId, GSI1_SK"
    })
  );

  // TODO: Pagination and randomness
  const result = [] as any[]; // TODO: Type definitions
  (memoryRecords ?? []).forEach(memoryRecord => {
    const memory = attr.unwrap(memoryRecord);
    result.push({
      id: memory.SK.substring(MEMORY_PREFIX.length),
      text: memory.mText,
      authorId: memory.mAuthorId.substring(USER_PREFIX.length),
      dateCreated: memory.GSI1_SK,
    });
  });

  return Response.json(result);
}

// Create a new memory in this jar
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  // TODO: Read userId from currently logged in user
  if (!body.userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }
  if (!body.text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  // Ensure that optional date param is formatted correctly
  let dateCreated: string;
  if (body.date) {
    try {
      dateCreated = new Date(body.date).toISOString();
    } catch {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }
  } else {
    dateCreated = new Date(Date.now()).toISOString();
  }

  const userId = `${USER_PREFIX}${body.userId}`;
  const jarId = `${JAR_PREFIX}${params.id}`;
  const memoryId = `${MEMORY_PREFIX}${uuid.v4()}`;
  const Key = attr.wrap({
    PK: jarId,
    SK: memoryId,
  });
  const update = updateExpr()
    .set({ GSI1_PK: jarId })
    .set({ GSI1_SK: dateCreated })
    .set({ mText: body.text })
    .set({ mAuthorId: userId })
    .expr();
  console.log(update);

  const { Attributes } = await client.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key,
      ...update,
      ReturnValues: "ALL_NEW",
    })
  );
  // TODO: Error handling

  const newMemoryRecord = attr.unwrap(Attributes ?? {});

  return Response.json({
    id: newMemoryRecord.SK.substring(USER_PREFIX.length),
    dateCreated: newMemoryRecord.GSI1_SK,
  });
}
