import React from 'react';
import { motion } from 'motion/react';
import { Database } from 'lucide-react';
import { LMLAMetadata } from '../types';

interface MetadataPanelProps {
  metadata: LMLAMetadata | null;
  blueprint: LMLAMetadata | null;
  role: 'user' | 'assistant';
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, blueprint, role }) => {
  if (!metadata && !blueprint) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center italic">
        <Database className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-[11px] font-medium tracking-tight uppercase">Latent_Attention_Idle</p>
        <p className="mt-2 text-[10px] leading-relaxed max-w-[200px]">Select a sequence to initiate isotopic decomposition and structural mapping.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 flex flex-col gap-4">
      {/* Input Analysis: Isotopic (Top) -> Variables (Bottom) */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        <div className="bg-slate-800 text-white px-3 py-2 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest">Input Breakdown</span>
          <span className="text-[9px] font-mono opacity-60 uppercase">Phase_01: Isotopic_Analysis</span>
        </div>
        <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar space-y-8">
          {metadata?.isotopicBreaks?.map((br, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">CHUNK_{idx.toString().padStart(2, '0')}</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              
              {/* TOP: Isotopic Break (Sentence/WXYZ) */}
              <div className="space-y-2">
                <div className="flex gap-3 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  <Metric label="X" value={br.x.toString()} />
                  <Metric label="Y" value={br.y.toString()} />
                  <Metric label="Z" value={br.z.toString()} />
                  <Metric label="W" value={br.w.toFixed(1)} />
                </div>
                <div className="text-[10px] font-sans italic text-slate-600 bg-slate-50/30 p-2 rounded border-l-2 border-slate-300">
                  "{br.sentence}"
                </div>
              </div>

              {/* BOTTOM: Variable Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <VariableBox label="Subject" varObj={br.variables.subject} type="independent" index={1} />
                <VariableBox label="Action" varObj={br.variables.action} type="independent" index={2} />
                <VariableBox label="Object" varObj={br.variables.object} type="dependent" index={3} />
                <VariableBox label="Result" varObj={br.variables.result} type="dependent" index={4} />
                <VariableBox label="Pre-Condition" varObj={br.variables.preCondition} type="constant" index={5} />
                <VariableBox label="Situation" varObj={br.variables.situation} type="constant" index={6} />
              </div>
            </div>
          ))}
          {!metadata && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 italic">
              <p className="text-[10px] font-mono">WAITING_FOR_INPUT_SEQUENCE</p>
            </div>
          )}
        </div>
      </div>

      {/* Output Analysis: Blueprint (Top) -> Skin (Bottom) */}
      <div className="flex flex-col flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        <div className="bg-indigo-600 text-white px-3 py-2 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest">Output Breakdown</span>
          <span className="text-[9px] font-mono opacity-60 uppercase">Phase_02: Blueprint_Synthesis</span>
        </div>
        <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar space-y-8">
          {blueprint?.isotopicBreaks?.map((br, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">GEN_CHUNK_{idx.toString().padStart(2, '0')}</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* TOP: Structure/Blueprint (6 Variables) */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {br.variables.subject.value.toLowerCase().includes('(math)') ? 'Calculation Breakdown' : 
                   br.variables.subject.value.toLowerCase().includes('(phatic)') ? 'Phatic Exchange' :
                   'Linguistic Blueprint'}
                </span>
                <div className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-inner">
                  {br.variables.subject.value.toLowerCase().includes('(math)') || br.variables.subject.value.toLowerCase().includes('(phatic)') ? (
                    <>
                      {Object.values(br.variables).map((v, i) => {
                        const val = v as { value: string };
                        if (val.value && val.value !== 'null' && val.value !== 'N/A') {
                          return (
                            <div key={i} className="flex items-center gap-2 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                              <span className="text-[10px] font-mono text-amber-400 italic leading-tight">
                                {val.value}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </>
                  ) : (
                    <>
                      <BlueprintItem label="S" valueObj={br.variables.subject} />
                      <BlueprintItem label="A" valueObj={br.variables.action} />
                      <BlueprintItem label="O" valueObj={br.variables.object} />
                      <BlueprintItem label="R" valueObj={br.variables.result} />
                      <BlueprintItem label="C" valueObj={br.variables.preCondition} />
                      <BlueprintItem label="E" valueObj={br.variables.situation} />
                    </>
                  )}
                </div>
              </div>

              {/* BOTTOM: Isotopic Skinning (Sentence) */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Linguistic Skinning</span>
                <div className="text-[11px] leading-relaxed text-slate-700 bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded shadow-sm">
                  {br.sentence}
                </div>
              </div>
            </div>
          ))}
          {!blueprint && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 italic">
              <p className="text-[10px] font-mono uppercase">Reasoning_Latent_Space...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BlueprintItem = ({ label, valueObj }: { label: string; valueObj: any }) => (
  <div className="flex flex-col gap-1 border-b border-slate-800 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-emerald-500 font-bold shrink-0">{label}:</span>
      <span className="text-[10px] font-mono text-emerald-400 font-medium whitespace-pre-wrap break-words italic">
        {valueObj.value || "NULL"}
      </span>
    </div>
  </div>
);

const VariableBox = ({ label, varObj, type, index }: { label: string; varObj: any; type: 'independent' | 'dependent' | 'constant', index: number }) => {
  const colors = {
    independent: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    dependent: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    constant: 'bg-slate-50 border-slate-200 text-slate-700'
  };

  return (
    <div className={`p-2 border rounded-md ${colors[type]} transition-all hover:shadow-sm`}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">[{index}] {label}</span>
      </div>
      <div className="text-[10px] font-medium leading-tight break-words mb-1.5">{varObj.value || 'N/A'}</div>
      {(varObj.metaphor || varObj.crossTopic) && (
        <div className="space-y-1">
          {varObj.metaphor && (
            <div className="text-[7px] font-bold uppercase py-0.5 px-1 bg-white/40 rounded border border-black/5 break-words" title={varObj.metaphor}>
              MTR: {varObj.metaphor}
            </div>
          )}
          {varObj.crossTopic && (
            <div className="text-[7px] font-bold uppercase py-0.5 px-1 bg-white/40 rounded border border-black/5 break-words" title={varObj.crossTopic}>
              CRS: {varObj.crossTopic}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Tag = ({ label, value, color }: { label: string; value: string; color: 'amber' | 'violet' }) => (
  <div className={`px-2 py-1 rounded border text-[9px] font-bold uppercase ${
    color === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-violet-50 border-violet-200 text-violet-700'
  }`}>
    <span className="opacity-50 mr-1">{label}:</span> {value}
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-[8px] text-slate-400 font-mono uppercase leading-none">{label}</div>
    <div className="text-[10px] font-bold font-mono leading-none mt-0.5">{value}</div>
  </div>
);
