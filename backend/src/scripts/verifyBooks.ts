import { readFileSync, existsSync } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Book from '../models/Book';

function loadEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  const total = await Book.countDocuments();
  const unique = await Book.distinct('sourceId');
  const page1 = await Book.find().sort({ downloadCount: -1 }).limit(20).select('title author sourceId');
  const page2 = await Book.find().sort({ downloadCount: -1 }).skip(20).limit(20).select('sourceId');
  const overlap = page1.filter((book) => page2.some((other) => other.sourceId === book.sourceId));
  console.log(`host=${uri.startsWith('mongodb+srv') ? 'atlas' : 'local'}`);
  console.log(`total=${total}`);
  console.log(`uniqueSourceIds=${unique.length}`);
  console.log(`page1=${page1.length} first="${page1[0]?.title || ''}"`);
  console.log(`page2=${page2.length} overlap=${overlap.length}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
