import { DynamoDBClient, BatchWriteItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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

/** Delete a jar */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const TABLE_NAME = process.env.TABLE_NAME;
  if (!TABLE_NAME) {
    return Response.json({ error: "Error reading table name" }, { status: 500 });
  }

  const jarId = `${JAR_PREFIX}${params.id}`;

  // TODO: Do retries until all entries deleted. Also how to handle deleting of memories within the jar?
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/BatchWriteItemCommand/
  // Maybe queue it up and delete over time to not use up all the throughput

  // Retrieve all users in this jar. TODO: Handle pagination if necessary (BatchWriteItems can write 25 max at once)
  const ExpressionAttributeValues = attr.wrap({
    ":jarId": jarId,
    ":userPrefix": USER_PREFIX,
  });
  const { Items } = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :jarId and begins_with(SK, :userPrefix)",
      ExpressionAttributeValues,
      ProjectionExpression: "SK",
    })
  );
  console.log('got items', Items);
  // const results = attr.unwrap(Items ?? {});

  // Delete the jar and the jar-user records
  const itemsToDelete = [{
    DeleteRequest: {
      Key: attr.wrap({ PK: jarId, SK: jarId })
    }
  }];
  Items?.forEach(item => {
    itemsToDelete.push({
      DeleteRequest: {
        Key: {
          ...attr.wrap({ PK: jarId }),
          SK: item.SK // No need to wrap this because it was returned by the QueryCommand above
        }
      }
    })
  });
  console.log('to delete', JSON.stringify(itemsToDelete));
  const response = await client.send(
    new BatchWriteItemCommand({
      RequestItems: {
        [TABLE_NAME]: itemsToDelete
      }
    })
  );
  // TODO: Handle response.UnprocessedItems

  return Response.json(response);
}

