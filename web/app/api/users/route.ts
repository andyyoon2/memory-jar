import * as uuid from 'uuid';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  const userId = `u#${uuid.v4()}`;
  console.log(userId);

  const response = await client.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: { S: userId },
        SK: { S: userId },
        uData: { M: { name: { S: body.name } } },
        "GSI1-PK": { S: userId },
        "GSI1-SK": { S: userId },
      }
    })
  );
  // TODO: Error handling

  return Response.json(response);
}
