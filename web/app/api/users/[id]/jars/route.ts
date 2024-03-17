import { JAR_PREFIX, USER_PREFIX } from "@/app/api/utils";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { AttributeValue as attr } from "dynamodb-data-types";

const client = new DynamoDBClient({});

// Get all jars for this user
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!params.id) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  // TODO: Handle pagination if necessary (BatchGetItems can get 100 max at once)
  const ExpressionAttributeValues = attr.wrap({
    ":userId": `${USER_PREFIX}${params.id}`,
    ":jarPrefix": JAR_PREFIX,
  });

  const { Items: jarRecords } = await client.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression:
        "GSI1_PK = :userId and begins_with(GSI1_SK, :jarPrefix)",
      ExpressionAttributeValues,
      ProjectionExpression: "GSI1_SK, mjName, mjColor, mjIcon",
    }),
  );

  const jars = (jarRecords ?? []).map((jarRecord) => {
    const jar = attr.unwrap(jarRecord);
    return {
      id: jar.GSI1_SK.substring(JAR_PREFIX.length),
      name: jar.mjName,
      color: jar.mjColor,
      icon: jar.mjIcon,
    };
  });

  return Response.json(jars);
}
