import "server-only";
import { PubSub } from "@google-cloud/pubsub";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export interface NotifyTarget {
  email: string;
  name: string;
}

export interface BaseEvent {
  event_type: string;
  source: string;
  timestamp: string;
  notify?: NotifyTarget[];
  data: Record<string, unknown>;
}

let pubsubClient: PubSub | null = null;

function getClient(): PubSub {
  if (!pubsubClient) {
    pubsubClient = new PubSub({ projectId: requiredEnv("GCP_PROJECT_ID") });
  }
  return pubsubClient;
}

export async function publishEvent(event: BaseEvent): Promise<string> {
  const topic = getClient().topic(requiredEnv("PUBSUB_TOPIC"));
  const messageId = await topic.publishMessage({
    json: event,
  });
  console.log(`Published event ${event.event_type} (message ${messageId})`);
  return messageId;
}
