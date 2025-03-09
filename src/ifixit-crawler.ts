// src/ifixit-crawler.ts
import { defaultConfig } from "../config.js";
import { crawl, write } from "./core.js";
import fetch from "node-fetch";

// Function to send data to Chroma
async function sendToChroma(jsonFilePath: string) {
  try {
    console.log(`Reading data from ${jsonFilePath}...`);
    
    // Read the JSON file
    const fs = await import('fs/promises');
    const jsonContent = await fs.readFile(jsonFilePath, 'utf-8');
    const data = JSON.parse(jsonContent);
    
    // Process each document for Chroma
    const documents = Array.isArray(data) ? data : [data];
    
    // Prepare documents for Chroma
    const chromaDocuments = documents.map((doc, index) => ({
      id: `ifixit-${index}`,
      text: doc.html, // The extracted content
      metadata: {
        title: doc.title,
        url: doc.url,
        source: 'ifixit'
      }
    }));
    
    // Send to Chroma
    const chromaHost = process.env.CHROMA_HOST || 'localhost';
    const chromaPort = process.env.CHROMA_PORT || '8000';
    
    console.log(`Sending ${chromaDocuments.length} documents to Chroma...`);
    
    // Create or get collection
    const collectionName = 'ifixit_guides';
    const collectionResponse = await fetch(`http://${chromaHost}:${chromaPort}/api/v1/collections/${collectionName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!collectionResponse.ok) {
      // Create collection if it doesn't exist
      await fetch(`http://${chromaHost}:${chromaPort}/api/v1/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collectionName,
          metadata: { source: 'ifixit_crawler' }
        })
      });
    }
    
    // Add documents in batches to avoid overwhelming the API
    const batchSize = 100;
    for (let i = 0; i < chromaDocuments.length; i += batchSize) {
      const batch = chromaDocuments.slice(i, i + batchSize);
      
      await fetch(`http://${chromaHost}:${chromaPort}/api/v1/collections/${collectionName}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: batch.map(doc => doc.text),
          metadatas: batch.map(doc => doc.metadata),
          ids: batch.map(doc => doc.id)
        })
      });
      
      console.log(`Sent batch ${i/batchSize + 1}/${Math.ceil(chromaDocuments.length/batchSize)}`);
    }
    
    console.log('Successfully added documents to Chroma');
  } catch (error) {
    console.error('Error sending data to Chroma:', error);
    throw error;
  }
}

// Main function to run crawler and send data to Chroma
async function main() {
  try {
    // Customize the configuration for iFixit
    const ifixitConfig = {
      ...defaultConfig,
      url: "https://www.ifixit.com/Guide",
      match: "https://www.ifixit.com/Guide/**",
      selector: ".guide-content", // Main content of guides
      maxPagesToCrawl: 1000,
      outputFileName: "data/ifixit-guides.json",
    };
    
    // Run the crawler
    console.log('Starting iFixit crawler...');
    await crawl(ifixitConfig);
    
    // Write results to JSON
    console.log('Writing results to JSON file...');
    const outputFile = await write(ifixitConfig);
    
    // Send data to Chroma
    console.log('Sending data to Chroma...');
    await sendToChroma(outputFile.toString());
    
    console.log('Crawling and processing complete!');
  } catch (error) {
    console.error('Error during crawling process:', error);
    process.exit(1);
  }
}

// Execute the main function
main();