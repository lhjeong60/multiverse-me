import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

let client = null

function getClient() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return client
}

export async function uploadImage(sessionId, index, imageBuffer, mimeType) {
  const key = `sessions/${sessionId}/${index}.jpg`

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType,
    })
  )

  return `${process.env.R2_PUBLIC_URL}/${key}`
}
