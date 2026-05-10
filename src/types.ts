/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LMLAVariable {
  value: string;
  metaphor?: string;
  crossTopic?: string;
}

export interface LMLAVariables {
  subject: LMLAVariable;
  action: LMLAVariable;
  object: LMLAVariable;
  result: LMLAVariable;
  preCondition: LMLAVariable;
  situation: LMLAVariable;
}

export interface IsotopicBreak {
  x: number; // Horizontal sequence
  y: number; // Vertical Topology
  z: number; // Structure-hierarchy depth
  w: number; // Granularity depth
  sentence: string;
  variables: LMLAVariables;
}

export interface LMLAMetadata {
  isotopicBreaks: IsotopicBreak[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: LMLAMetadata;
  blueprint?: LMLAMetadata; // For assistant responses
  status: 'processing' | 'done' | 'error';
}
