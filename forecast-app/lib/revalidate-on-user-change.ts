"use server";
import { revalidatePath } from 'next/cache';

export async function revalidateOnUserChange(): Promise<void> {
  revalidatePath('/');
}