/**
 * Binary Embedding Format Service
 * Converts embeddings to/from binary format for efficient storage
 * 
 * Format:
 * [Header (4 bytes)] [Metadata (variable)] [Embeddings (fixed)]
 * 
 * Header: Magic number + version
 * Metadata: embedding_dim (4 bytes) + count (4 bytes)
 * Each Embedding:
 *   - code_len (2 bytes) + code (utf-8)
 *   - description_len (2 bytes) + description (utf-8)
 *   - float32 vector (embedding_dim * 4 bytes)
 */

import { HSCodeEmbedding, EmbeddingMetadata } from '../types/hsCode';

export interface BinaryEmbeddingsHeader {
  version: number;
  embeddingDim: number;
  totalCodes: number;
  provider: string;
  model: string;
}

const MAGIC_NUMBER = 0x48534345; // "HSCE" in hex (HS Code Embeddings)
const VERSION = 1;

export class BinaryEmbeddingsService {
  /**
   * Convert embeddings to binary buffer
   */
  static embeddingsToBinary(
    embeddings: HSCodeEmbedding[],
    metadata: EmbeddingMetadata
  ): Uint8Array {
    if (embeddings.length === 0) {
      throw new Error('No embeddings to convert');
    }

    const embeddingDim = embeddings[0].embedding.length;

    // Calculate total size needed
    let totalSize = 16; // Magic number (4) + Version (4) + Dim (4) + Count (4)
    totalSize += 256; // Provider and model (max 256 bytes)

    // Calculate size for each embedding
    embeddings.forEach((emb) => {
      const encoder = new TextEncoder();
      const codeBytes = encoder.encode(emb.code);
      const menuBytes = encoder.encode(emb.menu || '');
      const descBytes = encoder.encode(emb.description);
      const chapterBytes = encoder.encode(emb.chapter);
      const sectionBytes = encoder.encode(emb.section);
      
      totalSize += 2 + codeBytes.length; // code_len + code
      totalSize += 2 + menuBytes.length; // menu_len + menu
      totalSize += 2 + descBytes.length; // desc_len + desc
      totalSize += 2 + chapterBytes.length; // chapter_len + chapter
      totalSize += 2 + sectionBytes.length; // section_len + section
      totalSize += embeddingDim * 4; // embedding (float32)
    });

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    let offset = 0;

    // Write header
    view.setUint32(offset, MAGIC_NUMBER, false); // Big-endian
    offset += 4;

    view.setUint32(offset, VERSION, false);
    offset += 4;

    view.setUint32(offset, embeddingDim, false);
    offset += 4;

    view.setUint32(offset, embeddings.length, false);
    offset += 4;

    // Write provider and model strings
    const providerBytes = this.encodeString(metadata.provider, 128);
    uint8.set(providerBytes, offset);
    offset += 128;

    const modelBytes = this.encodeString(metadata.model, 128);
    uint8.set(modelBytes, offset);
    offset += 128;

    // Write embeddings
    embeddings.forEach((emb) => {
      // Write code
      const codeBytes = this.encodeString(emb.code);
      view.setUint16(offset, codeBytes.length, false);
      offset += 2;
      uint8.set(codeBytes, offset);
      offset += codeBytes.length;

      // Write menu
      const menuBytes = this.encodeString(emb.menu || '');
      view.setUint16(offset, menuBytes.length, false);
      offset += 2;
      uint8.set(menuBytes, offset);
      offset += menuBytes.length;

      // Write description
      const descBytes = this.encodeString(emb.description);
      view.setUint16(offset, descBytes.length, false);
      offset += 2;
      uint8.set(descBytes, offset);
      offset += descBytes.length;

      // Write chapter
      const chapterBytes = this.encodeString(emb.chapter);
      view.setUint16(offset, chapterBytes.length, false);
      offset += 2;
      uint8.set(chapterBytes, offset);
      offset += chapterBytes.length;

      // Write section
      const sectionBytes = this.encodeString(emb.section);
      view.setUint16(offset, sectionBytes.length, false);
      offset += 2;
      uint8.set(sectionBytes, offset);
      offset += sectionBytes.length;

      // Write embedding vector (float32)
      emb.embedding.forEach((val) => {
        view.setFloat32(offset, val, false);
        offset += 4;
      });
    });

    return uint8.slice(0, offset);
  }

  /**
   * Convert binary buffer to embeddings
   */
  static binaryToEmbeddings(buffer: ArrayBuffer): {
    embeddings: HSCodeEmbedding[];
    header: BinaryEmbeddingsHeader;
  } {
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);
    let offset = 0;

    // Read header
    const magicNumber = view.getUint32(offset, false);
    offset += 4;

    if (magicNumber !== MAGIC_NUMBER) {
      throw new Error('Invalid binary embeddings format');
    }

    const version = view.getUint32(offset, false);
    offset += 4;

    if (version !== VERSION) {
      throw new Error(`Unsupported binary format version: ${version}`);
    }

    const embeddingDim = view.getUint32(offset, false);
    offset += 4;

    const totalCodes = view.getUint32(offset, false);
    offset += 4;

    // Read provider and model
    const providerBytes = uint8.slice(offset, offset + 128);
    const provider = this.decodeString(providerBytes);
    offset += 128;

    const modelBytes = uint8.slice(offset, offset + 128);
    const model = this.decodeString(modelBytes);
    offset += 128;

    const header: BinaryEmbeddingsHeader = {
      version,
      embeddingDim,
      totalCodes,
      provider,
      model
    };

    // Read embeddings
    const embeddings: HSCodeEmbedding[] = [];

    for (let i = 0; i < totalCodes; i++) {
      // Read code
      const codeLen = view.getUint16(offset, false);
      offset += 2;
      const code = this.decodeString(uint8.slice(offset, offset + codeLen));
      offset += codeLen;

      // Read menu
      const menuLen = view.getUint16(offset, false);
      offset += 2;
      const menu = this.decodeString(uint8.slice(offset, offset + menuLen));
      offset += menuLen;

      // Read description
      const descLen = view.getUint16(offset, false);
      offset += 2;
      const description = this.decodeString(uint8.slice(offset, offset + descLen));
      offset += descLen;

      // Read chapter
      const chapterLen = view.getUint16(offset, false);
      offset += 2;
      const chapter = this.decodeString(uint8.slice(offset, offset + chapterLen));
      offset += chapterLen;

      // Read section
      const sectionLen = view.getUint16(offset, false);
      offset += 2;
      const section = this.decodeString(uint8.slice(offset, offset + sectionLen));
      offset += sectionLen;

      // Read embedding vector
      const embedding: number[] = [];
      for (let j = 0; j < embeddingDim; j++) {
        embedding.push(view.getFloat32(offset, false));
        offset += 4;
      }

      embeddings.push({
        code,
        menu,
        description,
        chapter,
        section,
        embedding,
        provider: header.provider,
        model: header.model
      });
    }

    return { embeddings, header };
  }

  /**
   * Convert embeddings to Base64 for transport
   */
  static binaryToBase64(binary: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return btoa(binaryString);
  }

  /**
   * Convert Base64 to binary buffer
   */
  static base64ToBinary(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Get size reduction information
   */
  static calculateSizeReduction(
    jsonSize: number,
    binarySize: number
  ): {
    percentage: string;
    reduction: string;
  } {
    const ratio = (1 - binarySize / jsonSize) * 100;
    const reduction = (jsonSize - binarySize) / 1024; // KB

    return {
      percentage: ratio.toFixed(1),
      reduction: reduction.toFixed(1)
    };
  }

  /**
   * Encode string to UTF-8 bytes
   */
  private static encodeString(str: string, maxLength?: number): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);

    if (maxLength && encoded.length > maxLength) {
      return encoded.slice(0, maxLength);
    }

    if (maxLength) {
      const padded = new Uint8Array(maxLength);
      padded.set(encoded);
      return padded;
    }

    return encoded;
  }

  /**
   * Decode UTF-8 bytes to string
   */
  private static decodeString(bytes: Uint8Array): string {
    // Find null terminator if present
    let length = bytes.length;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0) {
        length = i;
        break;
      }
    }

    const decoder = new TextDecoder();
    return decoder.decode(bytes.slice(0, length));
  }
}
