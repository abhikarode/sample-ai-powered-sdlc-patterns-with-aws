// Document Upload Page Component
// Interface for uploading documents

import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import React from 'react';

export const DocumentUploadPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Upload Documents</h1>
        <p className="text-white/60">This page will be implemented in a future task</p>
      </motion.div>
    </div>
  );
};