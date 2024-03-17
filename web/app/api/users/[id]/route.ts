// https://github.com/vercel/examples/blob/main/solutions/aws-dynamodb/pages/api/item.js

import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { AttributeValue as attr } from "dynamodb-data-types";
import { USER_PREFIX } from "../../utils";

const client = new DynamoDBClient({});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const Key = attr.wrap({
    PK: `${USER_PREFIX}${params.id}`,
    SK: `${USER_PREFIX}${params.id}`,
  });

  const { Item } = await client.send(
    new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key,
    }),
  );

  const user = attr.unwrap(Item);
  return Response.json({
    id: user.PK.substring(USER_PREFIX.length),
    name: user.name,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const Key = attr.wrap({
    PK: `${USER_PREFIX}${params.id}`,
    SK: `${USER_PREFIX}${params.id}`,
  });

  const response = await client.send(
    new DeleteItemCommand({
      TableName: process.env.TABLE_NAME,
      Key,
    }),
  );

  return Response.json(response);
}
