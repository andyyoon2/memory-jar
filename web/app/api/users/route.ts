import * as uuid from 'uuid';
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AttributeValue as attr, updateExpr } from 'dynamodb-data-types';
import { USER_PREFIX } from '../utils';

const client = new DynamoDBClient({});

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const userId = `${USER_PREFIX}${uuid.v4()}`;
  const Key = attr.wrap({
    PK: userId,
    SK: userId,
  });
  const update = updateExpr()
    .set({ GSI1_PK: userId })
    .set({ GSI1_SK: userId })
    .set({ uName: body.name })
    .expr();

  const { Attributes } = await client.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key,
      ...update,
      ReturnValues: "ALL_NEW",
    })
  );
  // TODO: Error handling

  const newUserRecord = attr.unwrap(Attributes ?? {});

  return Response.json({ id: newUserRecord.PK.substring(USER_PREFIX.length) });
}

// SCAN - TODO: only for debugging purposes
export async function GET() {
  const { Items } = await client.send(
    new ScanCommand({
      TableName: process.env.TABLE_NAME,
      // FilterExpression: "contains(PK, :prefix)",
      // ExpressionAttributeValues: { ":prefix": { S: "u#" } },
    })
  );

  const users = Items?.map(attr.unwrap);
  return Response.json(users);
}

