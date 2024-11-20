#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

async function main() {
    const entitiesDir = path.join(process.cwd(), 'src/entities');
    const outputDir = path.join(process.cwd(), 'docs');

    console.log(`Scanning for entities in 'src/entities'...`);

    try {
        const entityFiles = globSync(`${entitiesDir}/**/*.ts`);
        if (!entityFiles.length) {
            throw new Error(`No entity files found in 'src/entities'.`);
        }

        const models = entityFiles.map(parseTypeORMEntity).filter(Boolean);

        if (!models.length) {
            throw new Error('No valid entities found. Ensure your files are properly decorated.');
        }

        models.sort((a, b) => a.name.localeCompare(b.name));

        const htmlContent = generateHtmlDocumentation(models);

        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
        fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent, 'utf-8');
        console.log(`Documentation generated at docs/index.html!`);
    } catch (error) {
        console.error('Error generating documentation:', error.message);
    }
}

function parseTypeORMEntity(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ast = parse(content, { sourceType: 'module', plugins: ['decorators-legacy', 'typescript'] });

    let entityName = '';
    const fields = [];

    traverse(ast, {
        ClassDeclaration(path) {
            const entityDecorator = path.node.decorators?.find(
                (decorator) => decorator.expression.callee?.name === 'Entity'
            );
            if (entityDecorator) {
                entityName = path.node.id.name;
            }
        },
        ClassProperty(path) {
            if (!entityName) return;

            const field = {};
            const decorators = path.node.decorators || [];

            decorators.forEach((decorator) => {
                const name = decorator.expression.callee?.name;

                if (name === 'Column') {
                    field.name = path.node.key.name;
                    field.type = decorator.expression.arguments[0]?.properties?.find(
                        (prop) => prop.key.name === 'type'
                    )?.value?.value || 'unknown';

                    const nullable = decorator.expression.arguments[0]?.properties?.find(
                        (prop) => prop.key.name === 'nullable'
                    )?.value?.value;
                    
                    field.isRequired = nullable === false;

                    field.isPrimary = !!decorators.find(
                        (d) => d.expression.callee?.name === 'PrimaryGeneratedColumn'
                    );
                }

                if (['ManyToOne', 'OneToOne', 'OneToMany', 'ManyToMany'].includes(name)) {
                    field.name = path.node.key.name;
                    field.type = 'relation';

                    const targetEntityArg = decorator.expression.arguments[0];
                    if (targetEntityArg && targetEntityArg.type === 'ArrowFunctionExpression') {
                        const entityNameInArrowFunc =
                            targetEntityArg.body.type === 'Identifier'
                                ? targetEntityArg.body.name
                                : targetEntityArg.body?.argument?.name;

                        field.targetEntity = entityNameInArrowFunc || 'unknown';
                    } else {
                        field.targetEntity = targetEntityArg?.name || 'unknown';
                    }

                    field.relationType = name;
                }
            });

            if (field.name) fields.push(field);
        },
    });

    return entityName ? { name: entityName, fields } : null;
}

function generateHtmlDocumentation(models) {
    return `
    <html>
    <head>
        <link rel="icon" href="https://avatars.githubusercontent.com/u/20165699?s=200&v=4" type="image/png">
        <title>TypeORM Entities Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; color: #333; margin: 0; }
            .sidebar { 
                width: 250px; 
                padding: 20px; 
                background-color: #f0f0f0; 
                position: fixed; 
                height: 96vh; 
                overflow-y: auto; 
            }
            .content { 
                margin-left: 270px; 
                padding: 50px; 
                flex-grow: 1; 
                background-color: #fff; 
            }
            .model { margin-bottom: 40px; }
            .model-name { font-size: 24px; font-weight: bold; color: #2e5972; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px 12px; text-align: left; border: 1px solid #ccc; }
            th { background-color: #2e5972; color: #fff; }
            .model-link, .field-link {
                color: #333;
                text-decoration: none;
                font-weight: bold;
                display: block;
                margin-bottom: 8px;
            }
            .model-fields {
                border-left: 2px solid #ccc;
                padding-left: 10px;
                margin-bottom: 20px;
            }
            .field-link { 
                padding: 4px 0;
                color: #6c757d;
            }
            .field-link:hover, .model-link:hover {
                color: #2e5972;
            }
            .target-link {
                color: #6B46C1;
                font-style: italic;
                text-decoration-style: wavy;
            }
            .target-link:hover {
                color: #926fe3;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .button {
                padding: 10px;
                margin: 18px;
                background-color: transparent;
                color: #2e5972;
                border: 1px solid #2e5972;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                transition: 0.3s;
            }
            .button:hover {
                background-color: #2e5972;
                color: #fff;
            }
            .relation, .type { font-weight: 600; }
            .relation { color: #6B46C1; }
            .type { color: #2B6CB0; }
            .required { color: #D53F8C; font-weight: bold; }
            .optional { color: #718096; }
        </style>
    </head>
    <body>
        <div class="sidebar">
             <img src="https://avatars.githubusercontent.com/u/20165699?s=200&v=4"
                alt="TypeORM Logo"
                style="width: 50px; margin-bottom: 20px; border-radius: 16px">
            <h2>TypeORM Entities</h2>

            ${models.map(model => `
                <a href="#${model.name}" class="model-link">${model.name.length > 30 ? model.name.slice(0, 27) + '...' : model.name}</a>
                <div class="model-fields">
                    ${model.fields.map(field => `
                        <a href="#${model.name}-${field.name}" class="field-link">${field.name.length > 30 ? field.name.slice(0, 27) + '...' : field.name}</a>
                    `).join('')}
                </div>
            `).join('')}
        </div>
        <div class="content">
            <div class="header">
                <h1>TypeORM Entities Documentation</h1>
                <button class="button" onclick="exportMarkdown()">Export as Markdown</button>
            </div>
            ${models.map(model => `
                <div class="model" id="${model.name}">
                    <div class="model-name">${model.name}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Relation Type</th>
                                <th>Target Entity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${model.fields.map(field => `
                                <tr id="${model.name}-${field.name}">
                                    <td>${field.name.length > 30 ? field.name.slice(0, 27) + '...' : field.name}</td>
                                    <td class="${field.type === 'relation' ? 'relation' : 'type'}">${field.type}</td>
                                    <td class="${field.isRequired ? 'required' : 'optional'}">${field.isRequired ? 'Yes' : 'No'}</td>
                                    <td>${field.relationType || '-'}</td>
                                    <td>
                                        ${field.targetEntity 
                                            ? `<a href="#${field.targetEntity}" class="target-link">${field.targetEntity.length > 30 ? field.targetEntity.slice(0, 27) + '...' : field.targetEntity}</a>`
                                            : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    </body>
    <script>
        function generateMarkdownDocumentation(models) {
            let markdownContent = '# TypeORM Entities Documentation\\n\\n';
            models.forEach(model => {
                markdownContent += '## ' + model.name + '\\n\\n';
                model.fields.forEach(field => {
                    const attributes = [];
                    if (field.isPrimary) attributes.push('@primaryGeneratedColumn');
                    if (field.isUnique) attributes.push('@unique');
                    if (field.relationType) attributes.push('@relation(' + field.relationType + ')');
                    markdownContent += '### ' + field.name + '\\n';
                    markdownContent += '**Description**: The \' + field.name + \' field from the ' + model.name + ' entity\\n\\n';
                    markdownContent += '| Parameter     | Value        |\\n';
                    markdownContent += '|---------------|--------------|\\n';
                    markdownContent += '| **Type**      | ' + field.type + ' |\\n';
                    markdownContent += '| **Required**  | ' + (field.isPrimary ? 'Yes' : 'No') + ' |\\n';
                    markdownContent += '| **Attributes**| ' + (attributes.length ? attributes.join(', ') : '-') + ' |\\n\\n';
                });
                markdownContent += '\\n';
            });
            return markdownContent;
        }
        function downloadMarkdown(content) {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'typeorm_entities_documentation.md';
            a.click();
            URL.revokeObjectURL(url);
        }
        function exportMarkdown() {
            const markdown = generateMarkdownDocumentation(${JSON.stringify(models)});
            downloadMarkdown(markdown);
        }
    </script>
    </html>`;
}

function generateMarkdownDocumentation(models) {
    let markdownContent = '# TypeORM Entities Documentation\n\n';

    models.forEach(model => {
        markdownContent += '## ' + model.name + '\n\n';

        model.fields.forEach(field => {
            const attributes = [];
            if (field.isPrimary) attributes.push('@primaryGeneratedColumn');
            if (field.isUnique) attributes.push('@unique');
            if (field.relationType) attributes.push('@relation(' + field.relationType + ')');

            markdownContent += '### ' + field.name + '\n';
            markdownContent += `**Description**: The '${field.name}' field from the ${model.name} entity\n\n`;
            markdownContent += '| Parameter     | Value        |\n';
            markdownContent += '|---------------|--------------|\n';
            markdownContent += '| **Type**      | ' + field.type + ' |\n';
            markdownContent += '| **Required**  | ' + (field.isPrimary ? 'Yes' : 'No') + ' |\n';
            markdownContent += '| **Attributes**| ' + (attributes.length ? attributes.join(', ') : '-') + ' |\n\n';
        });

        markdownContent += '\n';
    });

    return markdownContent;
}

main();

module.exports = {
    parseTypeORMEntity,
    generateHtmlDocumentation,
    generateMarkdownDocumentation
};