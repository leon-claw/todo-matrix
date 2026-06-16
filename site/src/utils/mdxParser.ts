import mdxRaw from '../content.mdx?raw';

export interface ContentData {
  title: string;
  hero_title_left: string;
  hero_title_accent: string;
  hero_title_right: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;

  value_sec_badge: string;
  value_sec_title: string;
  value_sec_desc: string;
  values_list: Array<{ id: string; title: string; desc: string }>;

  method_sec_badge: string;
  method_sec_title: string;
  method_sec_desc: string;
  quad_list: Array<{ id: string; title: string; action: string; desc: string; examples: string[] }>;

  workflow_sec_badge: string;
  workflow_sec_title: string;
  workflow_sec_desc: string;
  workflow_steps: Array<{ step: string; title: string; desc: string; subText: string }>;

  installer_sec_badge: string;
  installer_sec_title: string;
  installer_sec_desc: string;
  platforms_list: Array<{ name: string; badge: string; desc: string; action: string }>;

  eco_sec_badge: string;
  eco_sec_title: string;
  eco_sec_desc: string;
  eco_apps: Array<{ id: string; name: string; desc: string; status: string }>;

  trust_sec_badge: string;
  trust_sec_title: string;
  trust_sec_desc: string;
  trust_list: Array<{ title: string; desc: string }>;
}

function parseMdx(raw: string): ContentData {
  // Extract content between the first and second "---" lines
  const parts = raw.split('---');
  const frontmatter = parts.length > 1 ? parts[1] : '';

  const lines = frontmatter.split('\n');
  const result: any = {
    values_list: [],
    quad_list: [],
    workflow_steps: [],
    platforms_list: [],
    eco_apps: [],
    trust_list: []
  };

  let currentKey = '';
  let currentList: any[] = [];
  let currentListItem: any = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's a list item starting with "- "
    if (trimmed.startsWith('-')) {
      if (currentListItem) {
        currentList.push(currentListItem);
      }
      currentListItem = {};
      
      // Parse inline list properties if any (e.g. - id: "01" or - title: "...")
      const rest = trimmed.substring(1).trim();
      const colIdx = rest.indexOf(':');
      if (colIdx !== -1) {
        const itemKey = rest.substring(0, colIdx).trim();
        let itemVal = rest.substring(colIdx + 1).trim();
        // Remove quotes
        if (itemVal.startsWith('"') && itemVal.endsWith('"')) {
          itemVal = itemVal.substring(1, itemVal.length - 1);
        }
        // Handle array value eg: ["A", "B"]
        if (itemVal.startsWith('[') && itemVal.endsWith(']')) {
          try {
            // Replace single quotes or clean spaces
            const arrayStr = itemVal.replace(/'/g, '"');
            currentListItem[itemKey] = JSON.parse(arrayStr);
          } catch {
            currentListItem[itemKey] = [];
          }
        } else {
          currentListItem[itemKey] = itemVal;
        }
      }
      continue;
    }

    // Check if we are inside a list block and parsing nested properties (indented lines)
    if (line.startsWith('  ') && currentListItem) {
      const colIdx = trimmed.indexOf(':');
      if (colIdx !== -1) {
        const itemKey = trimmed.substring(0, colIdx).trim();
        let itemVal = trimmed.substring(colIdx + 1).trim();
        if (itemVal.startsWith('"') && itemVal.endsWith('"')) {
          itemVal = itemVal.substring(1, itemVal.length - 1);
        }
        if (itemVal.startsWith('[') && itemVal.endsWith(']')) {
          try {
            const arrayStr = itemVal.replace(/'/g, '"');
            currentListItem[itemKey] = JSON.parse(arrayStr);
          } catch {
            currentListItem[itemKey] = [];
          }
        } else {
          currentListItem[itemKey] = itemVal;
        }
      }
      continue;
    }

    // Parent properties key: value
    const parentColIdx = trimmed.indexOf(':');
    if (parentColIdx !== -1) {
      const parentKey = trimmed.substring(0, parentColIdx).trim();
      const parentVal = trimmed.substring(parentColIdx + 1).trim();

      // If it's starting a list
      if (!parentVal) {
        // Save previous list if any
        if (currentListItem && currentList) {
          currentList.push(currentListItem);
          currentListItem = null;
        }
        if (currentKey && currentList.length > 0) {
          result[currentKey] = currentList;
        }
        currentKey = parentKey;
        currentList = [];
        result[currentKey] = currentList;
      } else {
        // Save previous list item if transitioning back to a single key
        if (currentListItem && currentList) {
          currentList.push(currentListItem);
          currentListItem = null;
        }
        let cleanVal = parentVal;
        if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
          cleanVal = cleanVal.substring(1, cleanVal.length - 1);
        }
        result[parentKey] = cleanVal;
      }
    }
  }

  // Push final item or lists
  if (currentListItem && currentList) {
    currentList.push(currentListItem);
  }
  if (currentKey && currentList.length > 0) {
    result[currentKey] = currentList;
  }

  return {
    title: result.title || "Todo Matrix",
    hero_title_left: result.hero_title_left || "把待办放进",
    hero_title_accent: result.hero_title_accent || "重要与紧急",
    hero_title_right: result.hero_title_right || "的坐标里",
    hero_subtitle: result.hero_subtitle || "",
    hero_cta_primary: result.hero_cta_primary || "开始使用",
    hero_cta_secondary: result.hero_cta_secondary || "下载客户端",

    value_sec_badge: result.value_sec_badge || "",
    value_sec_title: result.value_sec_title || "",
    value_sec_desc: result.value_sec_desc || "",
    values_list: result.values_list || [],

    method_sec_badge: result.method_sec_badge || "",
    method_sec_title: result.method_sec_title || "",
    method_sec_desc: result.method_sec_desc || "",
    quad_list: result.quad_list || [],

    workflow_sec_badge: result.workflow_sec_badge || "",
    workflow_sec_title: result.workflow_sec_title || "",
    workflow_sec_desc: result.workflow_sec_desc || "",
    workflow_steps: result.workflow_steps || [],

    installer_sec_badge: result.installer_sec_badge || "",
    installer_sec_title: result.installer_sec_title || "",
    installer_sec_desc: result.installer_sec_desc || "",
    platforms_list: result.platforms_list || [],

    eco_sec_badge: result.eco_sec_badge || "",
    eco_sec_title: result.eco_sec_title || "",
    eco_sec_desc: result.eco_sec_desc || "",
    eco_apps: result.eco_apps || [],

    trust_sec_badge: result.trust_sec_badge || "",
    trust_sec_title: result.trust_sec_title || "",
    trust_sec_desc: result.trust_sec_desc || "",
    trust_list: result.trust_list || []
  };
}

export const content = parseMdx(mdxRaw);
