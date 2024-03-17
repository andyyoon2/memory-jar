import * as uuid from 'uuid';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { AttributeValue as attr, updateExpr } from 'dynamodb-data-types';
import { JAR_PREFIX, wrapKey } from '../utils';

const client = new DynamoDBClient({});

/** Create a new jar for a given user */
export async function POST(request: Request) {
  // TODO: Read the user from the currently logged-in user instead
  const body = await request.json();
  if (!body.name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!body.userId) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  // Build UpdateCommand for new jar
  const jarId = `${JAR_PREFIX}${uuid.v4()}`;
  const jarKey = attr.wrap({
    PK: jarId,
    SK: jarId,
  });
  const jarUpdateExpr = updateExpr()
    .set({ GSI1_PK: jarId })
    .set({ GSI1_SK: jarId })
    .set({ mjName: body.name })
    .expr();

  // Build UpdateCommand for the creating user
  const userId = wrapKey(body.userId, 'user');
  const jarUserKey = attr.wrap({
    PK: jarId,
    SK: userId,
  });
  const jarUserUpdateExpr = updateExpr()
    .set({ GSI1_PK: userId })
    .set({ GSI1_SK: jarId })
    .set({ mjName: body.name })
    .expr();

  // Create new jar and jar-user record in one transaction
  await client.send(
    new TransactWriteItemsCommand({
      TransactItems: [
        {
          Update: {
            TableName: process.env.TABLE_NAME,
            Key: jarKey,
            ...jarUpdateExpr,
          }
        },
        {
          Update: {
            TableName: process.env.TABLE_NAME,
            Key: jarUserKey,
            ...jarUserUpdateExpr,
          }
        },
      ],
    })
  );
  // TODO: Read response if nec, handle errors

  return Response.json({ id: jarId });
}
