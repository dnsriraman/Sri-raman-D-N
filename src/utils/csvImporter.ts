import { ProjectItem, CredentialItem, ProjectStatus, CredentialType, OperationType } from '../types';
import { db, handleFirestoreError } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';

export interface ValidationResult<T> {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: T | null;
  raw: Record<string, string>;
}

export interface BulkImportReport {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warningCount: number;
  results: ValidationResult<any>[];
}

/**
 * Robust CSV parser that correctly handles:
 * - Quoted fields with commas (e.g. "React, Node.js, TypeScript")
 * - Escaped double quotes inside quotes ("" -> ")
 * - Multi-line fields
 * - \r\n and \n line endings
 * - UTF-8 BOM headers
 */
export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [] };
  }

  // Strip Byte Order Mark (BOM) if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        // End of quoted section
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((field) => field !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((field) => field !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Push trailing field
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field !== '')) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Normalized header keys (lowercase, trimmed, underscores/hyphens normalized)
  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => h.trim());

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const rowCells = lines[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rowCells[idx] !== undefined ? rowCells[idx] : '';
    });
    // Also attach lowercase normalized keys for easy matching
    headers.forEach((header, idx) => {
      const normalizedKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      rowObj[`__norm_${normalizedKey}`] = rowCells[idx] !== undefined ? rowCells[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/** Helper to extract field value with alias fallback */
function getRowField(row: Record<string, string>, possibleNames: string[]): string {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== '') {
      return row[name];
    }
    const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (row[`__norm_${norm}`] !== undefined && row[`__norm_${norm}`] !== '') {
      return row[`__norm_${norm}`];
    }
  }
  return '';
}

/** Generate a URL/Firestore-safe unique ID */
function generateSafeId(title: string, prefix = 'item'): string {
  const clean = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return clean ? `${clean}-${randomSuffix}` : `${prefix}-${Date.now()}-${randomSuffix}`;
}

/**
 * Validate a batch of Project rows
 */
export function validateProjectRows(
  rows: Record<string, string>[],
  currentUserId: string
): BulkImportReport {
  const results: ValidationResult<ProjectItem>[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let warningCount = 0;

  const validStatuses: ProjectStatus[] = ['active', 'completed', 'in_progress', 'concept'];
  const validVisualTypes = ['helmet', 'insect', 'cutter', 'ration', 'code', 'web', 'iot'];

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2; // Line 1 is headers
    const errors: string[] = [];
    const warnings: string[] = [];

    const rawTitle = getRowField(row, ['title', 'project_title', 'project', 'name']);
    const rawCategory = getRowField(row, ['category', 'type', 'domain', 'field']);
    const rawDescription = getRowField(row, ['description', 'desc', 'summary', 'about', 'details']);
    const rawTechStack = getRowField(row, ['techStack', 'tech_stack', 'technologies', 'stack', 'tags', 'skills']);
    const rawStatus = getRowField(row, ['status', 'state']);
    const rawVisualType = getRowField(row, ['visualType', 'visual_type', 'visual', 'icon', 'theme']);
    const rawGithubUrl = getRowField(row, ['githubUrl', 'github', 'github_url', 'repo', 'repository']);
    const rawLiveDemoUrl = getRowField(row, ['liveDemoUrl', 'live_demo', 'demo_url', 'demo', 'url', 'link']);
    const rawIsFeatured = getRowField(row, ['isFeatured', 'featured', 'is_featured', 'star']);
    const rawId = getRowField(row, ['id', 'slug', 'project_id']);

    // 1. Validate Title
    if (!rawTitle.trim()) {
      errors.push('Missing required field: "title"');
    } else if (rawTitle.length > 120) {
      errors.push(`Title exceeds 120 characters limit (got ${rawTitle.length})`);
    }

    // 2. Validate Description
    if (!rawDescription.trim()) {
      errors.push('Missing required field: "description"');
    } else if (rawDescription.length > 1000) {
      errors.push(`Description exceeds 1000 characters limit (got ${rawDescription.length})`);
    }

    // 3. Validate Category
    let category = rawCategory.trim() || 'Software Development';
    if (category.length > 60) {
      warnings.push(`Category truncated to 60 characters`);
      category = category.slice(0, 60);
    }

    // 4. Validate Tech Stack
    let techStack: string[] = [];
    if (rawTechStack.trim()) {
      techStack = rawTechStack
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 20);
    } else {
      warnings.push('Tech stack was empty; defaulted to generic stack');
      techStack = ['TypeScript', 'React'];
    }

    // 5. Validate Status
    let status: ProjectStatus = 'active';
    if (rawStatus) {
      const normalizedStatus = rawStatus.toLowerCase().replace(/[\s-]/g, '_');
      if (validStatuses.includes(normalizedStatus as ProjectStatus)) {
        status = normalizedStatus as ProjectStatus;
      } else {
        warnings.push(`Invalid status "${rawStatus}". Defaulted to "active"`);
      }
    }

    // 6. Validate Visual Type
    let visualType: any = 'code';
    if (rawVisualType) {
      const normVisual = rawVisualType.toLowerCase().trim();
      if (validVisualTypes.includes(normVisual)) {
        visualType = normVisual;
      } else {
        warnings.push(`Visual type "${rawVisualType}" unrecognized. Defaulted to "code"`);
      }
    }

    // 7. Validate URLs (optional)
    let githubUrl = rawGithubUrl.trim() || undefined;
    if (githubUrl && githubUrl.length > 300) {
      errors.push('GitHub URL exceeds 300 characters limit');
    }

    let liveDemoUrl = rawLiveDemoUrl.trim() || undefined;
    if (liveDemoUrl && liveDemoUrl.length > 300) {
      errors.push('Live Demo URL exceeds 300 characters limit');
    }

    // 8. Validate isFeatured
    let isFeatured = false;
    if (rawIsFeatured) {
      const f = rawIsFeatured.toLowerCase().trim();
      isFeatured = f === 'true' || f === '1' || f === 'yes' || f === 'y';
    }

    // 9. ID sanitization
    let id = rawId.trim();
    if (id) {
      id = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    } else {
      id = generateSafeId(rawTitle, 'proj');
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
    if (warnings.length > 0) {
      warningCount++;
    }

    const now = new Date().toISOString();
    const itemData: ProjectItem | null = isValid
      ? {
          id,
          title: rawTitle.trim(),
          category,
          description: rawDescription.trim(),
          techStack,
          status,
          visualType,
          githubUrl,
          liveDemoUrl,
          isFeatured,
          createdBy: currentUserId || 'system',
          createdAt: now,
          updatedAt: now,
        }
      : null;

    results.push({
      rowIndex,
      valid: isValid,
      errors,
      warnings,
      data: itemData,
      raw: row,
    });
  });

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    warningCount,
    results,
  };
}

/**
 * Validate a batch of Credential rows
 */
export function validateCredentialRows(
  rows: Record<string, string>[],
  currentUserId: string
): BulkImportReport {
  const results: ValidationResult<CredentialItem>[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let warningCount = 0;

  const validTypes: CredentialType[] = ['certification', 'achievement', 'experience', 'education'];

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const rawTitle = getRowField(row, ['title', 'name', 'degree', 'credential_title', 'certification_name', 'award']);
    const rawOrg = getRowField(row, ['organization', 'org', 'issuer', 'company', 'university', 'institution']);
    const rawType = getRowField(row, ['type', 'credential_type', 'category', 'kind']);
    const rawDate = getRowField(row, ['date', 'year', 'duration', 'period', 'timeline', 'issued']);
    const rawDescription = getRowField(row, ['description', 'desc', 'summary', 'details', 'notes']);
    const rawLink = getRowField(row, ['link', 'url', 'credential_url', 'verify_url', 'certificate_url']);
    const rawTags = getRowField(row, ['tags', 'skills', 'domain', 'topics']);
    const rawId = getRowField(row, ['id', 'slug', 'credential_id']);

    // 1. Validate Title
    if (!rawTitle.trim()) {
      errors.push('Missing required field: "title"');
    } else if (rawTitle.length > 150) {
      errors.push(`Title exceeds 150 characters limit (got ${rawTitle.length})`);
    }

    // 2. Validate Organization
    if (!rawOrg.trim()) {
      errors.push('Missing required field: "organization" (or issuer / company / university)');
    } else if (rawOrg.length > 150) {
      errors.push(`Organization exceeds 150 characters limit (got ${rawOrg.length})`);
    }

    // 3. Validate Type
    let type: CredentialType = 'certification';
    if (!rawType.trim()) {
      warnings.push('Type not specified; defaulted to "certification"');
    } else {
      const normType = rawType.toLowerCase().trim();
      if (validTypes.includes(normType as CredentialType)) {
        type = normType as CredentialType;
      } else if (normType.includes('cert') || normType.includes('course')) {
        type = 'certification';
      } else if (normType.includes('achieve') || normType.includes('hack') || normType.includes('award') || normType.includes('winner')) {
        type = 'achievement';
      } else if (normType.includes('exp') || normType.includes('work') || normType.includes('intern') || normType.includes('job')) {
        type = 'experience';
      } else if (normType.includes('edu') || normType.includes('degree') || normType.includes('school') || normType.includes('college')) {
        type = 'education';
      } else {
        errors.push(`Invalid type "${rawType}". Must be one of: certification, achievement, experience, education`);
      }
    }

    // 4. Validate Date
    let date = rawDate.trim();
    if (!date) {
      warnings.push('Date was empty; defaulted to current year');
      date = new Date().getFullYear().toString();
    }

    // 5. Validate Description (optional)
    let description = rawDescription.trim() || undefined;
    if (description && description.length > 800) {
      warnings.push('Description exceeded 800 characters and was trimmed');
      description = description.slice(0, 800);
    }

    // 6. Validate Link (optional)
    let link = rawLink.trim() || undefined;
    if (link && link.length > 300) {
      errors.push('Link URL exceeds 300 characters limit');
    }

    // 7. Validate Tags (optional)
    let tags: string[] | undefined = undefined;
    if (rawTags.trim()) {
      tags = rawTags
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 20);
    }

    // 8. ID Sanitization
    let id = rawId.trim();
    if (id) {
      id = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
    } else {
      id = generateSafeId(rawTitle, 'cred');
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
    if (warnings.length > 0) {
      warningCount++;
    }

    const now = new Date().toISOString();
    const itemData: CredentialItem | null = isValid
      ? {
          id,
          type,
          title: rawTitle.trim(),
          organization: rawOrg.trim(),
          date,
          description,
          link,
          tags,
          createdBy: currentUserId || 'system',
          createdAt: now,
        }
      : null;

    results.push({
      rowIndex,
      valid: isValid,
      errors,
      warnings,
      data: itemData,
      raw: row,
    });
  });

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    warningCount,
    results,
  };
}

/**
 * Execute batch writes into Firestore
 */
export async function executeBulkFirestoreImport<T extends { id: string }>(
  collectionName: 'projects' | 'credentials',
  items: T[]
): Promise<{ successCount: number; errors: string[] }> {
  if (!items || items.length === 0) {
    return { successCount: 0, errors: [] };
  }

  // Firestore allows up to 500 writes per batch. We chunk by 400 for safety.
  const CHUNK_SIZE = 400;
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }

  let successCount = 0;
  const errors: string[] = [];

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    const batch = writeBatch(db);

    chunk.forEach((item) => {
      // Remove any undefined values
      const cleanData: Record<string, any> = {};
      Object.keys(item).forEach((k) => {
        if ((item as any)[k] !== undefined) {
          cleanData[k] = (item as any)[k];
        }
      });
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, cleanData, { merge: true });
    });

    try {
      await batch.commit();
      successCount += chunk.length;
    } catch (err: any) {
      console.error(`Error importing batch ${chunkIdx + 1}:`, err);
      errors.push(err?.message || `Failed to commit batch ${chunkIdx + 1}`);
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  }

  return { successCount, errors };
}

/**
 * Predefined Sample CSV Templates for instant user download or testing
 */
export const SAMPLE_PROJECTS_CSV = `title,category,description,techStack,status,visualType,githubUrl,liveDemoUrl,isFeatured
"Smart Solar Tracker with MPPT","Clean Energy","Autonomous dual-axis solar positioning system with real-time irradiance tracking and cloud telemetry.","ESP32, C++, FreeRTOS, MQTT, Firebase",completed,iot,"https://github.com/dnsriraman/solar-tracker","https://solar.dnsriraman.dev",true
"Autonomous Delivery Rover","Robotics","Obstacle avoidance ground vehicle equipped with ultrasonic LIDAR array and path optimization.","ROS2, Python, OpenCV, Raspberry Pi 4",in_progress,code,"https://github.com/dnsriraman/delivery-rover","",false
"AI Edge Voice Synthesizer","Machine Learning","Low-latency embedded voice recognition and keyword spotting model running on microcontroller.","TensorFlow Lite, C++, Audio DSP",active,web,"https://github.com/dnsriraman/edge-voice","https://voice.dnsriraman.dev",true`;

export const SAMPLE_CREDENTIALS_CSV = `type,title,organization,date,description,link,tags
certification,"AWS Certified Solutions Architect","Amazon Web Services","2024","Demonstrated technical expertise in designing resilient and scalable cloud distributed architectures.","https://aws.amazon.com/verification","Cloud, AWS, Architecture"
achievement,"1st Place — National Hackathon 2024","IEEE Technical Council","Oct 2024","Developed an edge IoT water purification diagnostic monitor evaluated by industry judges.","https://hackathon.example.com","IoT, Hackathon, Hardware"
experience,"Embedded Systems Research Intern","AeroSys Tech Labs","Jun 2024 - Aug 2024","Implemented real-time sensor fusion drivers and optimized battery telemetry algorithms in C.","","C, RTOS, Firmware, Microcontrollers"
education,"B.Tech in Computer Science","University Institute of Technology","2023 - 2027","Core studies in Data Structures, Algorithms, Distributed Systems and Operating Systems.","","Algorithms, Systems, Full-Stack"`;
