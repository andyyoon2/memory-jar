// https://github.com/vercel/examples/blob/main/solutions/aws-dynamodb/pages/api/item.js

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { Item } = await client.send(
    new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: { S: `u#${params.id}` },
        SK: { S: `u#${params.id}` }
      }
    })
  );
  return Response.json(Item);
}
