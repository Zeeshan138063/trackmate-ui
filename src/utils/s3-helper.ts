
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export class S3Helper {
    private client: S3Client;
    private bucketName: string;

    constructor() {
        const region = import.meta.env.VITE_AWS_REGION;
        const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
        const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
        this.bucketName = import.meta.env.VITE_AWS_BUCKET_NAME || '';

        if (!region || !accessKeyId || !secretAccessKey || !this.bucketName) {
            console.warn("AWS Credentials missing. S3 features will be disabled.");
            // We initialize with empty values to avoid crash, but methods will check
            this.client = new S3Client({
                region: 'us-east-1',
                credentials: { accessKeyId: '', secretAccessKey: '' }
            });
            return;
        }

        this.client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
    }

    async uploadResume(jobId: string, resumeJson: string): Promise<string> {
        if (!this.bucketName) throw new Error("AWS Bucket not configured");

        const key = `resumes/${jobId}_${Date.now()}.json`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: resumeJson,
            ContentType: "application/json",
            // Helper for simple "public" access if CORS allows, but usually we just keep it private and use signedURLs or direct Get if we have keys.
            // Since this is a local app with keys, we can just Put/Get directly.
        });

        await this.client.send(command);
        return key;
    }

    async getResume(key: string): Promise<any> {
        if (!this.bucketName) throw new Error("AWS Bucket not configured");

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        const response = await this.client.send(command);
        const str = await response.Body?.transformToString();

        if (!str) throw new Error("Empty response body from S3");
        return JSON.parse(str);
    }
}

export const s3Helper = new S3Helper();
