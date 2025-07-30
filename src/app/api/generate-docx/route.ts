import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const { summary, url } = await request.json();

    if (!summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    // Parse the summary to create structured document
    const lines = summary.split('\n').filter((line: string) => line.trim());
    const paragraphs: Paragraph[] = [];

    // Add title
    paragraphs.push(
      new Paragraph({
        text: 'Press Release Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 }
      })
    );

    // Add generated date
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated on: ',
            bold: true
          }),
          new TextRun({
            text: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          })
        ],
        spacing: { after: 600 }
      })
    );

    // Process each line of the summary
    let inBulletList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      if (!trimmedLine) {
        // Add spacing for empty lines
        if (inBulletList) {
          inBulletList = false;
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }
        continue;
      }

      // Check if it's a main heading (starts with - ** and ends with **)
      if (trimmedLine.match(/^-\s*\*\*.*\*\*$/)) {
        inBulletList = false;
        const headingText = trimmedLine.replace(/^-\s*\*\*(.*)\*\*$/, '$1');
        paragraphs.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 300 }
          })
        );
      }
      // Check if it's a regular heading (starts with ** and ends with **)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        inBulletList = false;
        const headingText = trimmedLine.slice(2, -2);
        paragraphs.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 200 }
          })
        );
      }
      // Check if it's a bullet point (starts with - or •)
      else if (trimmedLine.match(/^\s*[-•]\s/)) {
        if (!inBulletList) {
          inBulletList = true;
        }
        
        const bulletText = trimmedLine.replace(/^\s*[-•]\s*/, '');
        
        // Handle bold text within bullet points
        const parts = bulletText.split(/(\*\*.*?\*\*)/);
        const textRuns: TextRun[] = [];
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            textRuns.push(new TextRun({
              text: part.slice(2, -2),
              bold: true
            }));
          } else if (part.trim()) {
            textRuns.push(new TextRun({
              text: part
            }));
          }
        }

        if (textRuns.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        }
      }
      // Regular paragraph
      else {
        if (inBulletList) {
          inBulletList = false;
        }
        
        // Handle bold text within paragraphs
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
        const textRuns: TextRun[] = [];
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            textRuns.push(new TextRun({
              text: part.slice(2, -2),
              bold: true
            }));
          } else if (part.trim()) {
            textRuns.push(new TextRun({
              text: part
            }));
          }
        }

        if (textRuns.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              spacing: { after: 200 }
            })
          );
        }
      }
    }

    // Add separator and source URL at the end if provided
    if (url) {
      // Add some spacing before the source section
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { before: 600, after: 300 }
        })
      );

      // Add a separator line
      paragraphs.push(
        new Paragraph({
          text: '─'.repeat(50),
          spacing: { after: 300 }
        })
      );

      // Add source heading
      paragraphs.push(
        new Paragraph({
          text: 'Source',
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 200 }
        })
      );

      // Add the beautified URL
      const urlDisplay = url.length > 80 ? url.substring(0, 80) + '...' : url;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: urlDisplay,
              color: '0066CC',
              underline: {}
            })
          ],
          spacing: { after: 200 }
        })
      );

      // Add full URL if it was truncated
      if (url.length > 80) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Full URL: ',
                bold: true,
                size: 20
              }),
              new TextRun({
                text: url,
                size: 20,
                color: '666666'
              })
            ],
            spacing: { after: 200 }
          })
        );
      }
    }

    // Create the document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    // Generate the buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="press-release-summary.docx"',
      },
    });

  } catch (error) {
    console.error('DOCX generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate document' },
      { status: 500 }
    );
  }
}
