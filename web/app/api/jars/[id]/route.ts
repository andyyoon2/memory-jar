import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AttributeValue as attr, updateExpr } from 'dynamodb-data-types';
import { JAR_PREFIX, USER_PREFIX } from '../../utils';

const client = new DynamoDBClient({});

/** Add a user to a jar */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  if (!body.userId) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  // Build UpdateCommand for new jar->user record
  const jarId = `${JAR_PREFIX}${params.id}`;
  const userId = `${USER_PREFIX}${body.userId}`;
  const Key = attr.wrap({
    PK: jarId,
    SK: userId,
  });
  const jarUpdateExpr = updateExpr()
    .set({ GSI1_PK: userId })
    .set({ GSI1_SK: jarId })
    .set({ mjName: body.name })
    .expr();

  const { Attributes } = await client.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key,
      ...jarUpdateExpr,
      ReturnValues: "ALL_NEW",
    })
  );

  const newRecord = attr.unwrap(Attributes ?? {});
  return Response.json(newRecord);
}
