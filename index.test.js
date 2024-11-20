const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { parseTypeORMEntity, generateHtmlDocumentation, generateMarkdownDocumentation } = require('./index');

jest.mock('fs');
jest.mock('path');
jest.mock('glob');

describe('parseTypeORMEntity', () => {
    it('should parse a TypeORM entity and return its name and fields', () => {
        const entityContent = `
            import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

            @Entity()
            export class User {
                @PrimaryGeneratedColumn()
                id;

                @Column()
                firstName;

                @Column()
                lastName;

                @Column({ unique: true })
                email;

                @Column()
                password;

                @Column({ default: true })
                isActive;
            }
        `;
        fs.readFileSync.mockReturnValue(entityContent);

        const result = parseTypeORMEntity('src/entities/User.js');
        console.log('Parsed entity:', result);
        expect(result).toEqual({
            name: 'User',
            fields: [
                { name: 'firstName', type: 'unknown', isPrimary: false, isRequired: false },
                { name: 'lastName', type: 'unknown', isPrimary: false, isRequired: false },
                { name: 'email', type: 'unknown', isPrimary: false, isRequired: false },
                { name: 'password', type: 'unknown', isPrimary: false, isRequired: false },
                { name: 'isActive', type: 'unknown', isPrimary: false, isRequired: false }
            ]
        });
    });
});

describe('generateHtmlDocumentation', () => {
    it('should generate HTML documentation for given models', () => {
        const models = [
            {
                name: 'User',
                fields: [
                    { name: 'id', type: 'number', isPrimary: true, isRequired: true },
                    { name: 'firstName', type: 'unknown', isPrimary: false, isRequired: false },
                    { name: 'lastName', type: 'unknown', isPrimary: false, isRequired: false },
                    { name: 'email', type: 'unknown', isPrimary: false, isRequired: false },
                    { name: 'password', type: 'unknown', isPrimary: false, isRequired: false },
                    { name: 'isActive', type: 'unknown', isPrimary: false, isRequired: false }
                ]
            }
        ];

        const result = generateHtmlDocumentation(models);

        expect(result).toContain('<div class="model-name">User</div>');
        expect(result).toContain('<td>id</td>');
        expect(result).toContain('<td class="type">number</td>');
        expect(result).toContain('<td class="required">Yes</td>');
        expect(result).toContain('<table>');
        expect(result).toContain('<thead>');
        expect(result).toContain('<tr id="User-id">');
        
    });
});

describe('generateMarkdownDocumentation', () => {
    it('should generate Markdown documentation for given models', () => {
        const models = [
            {
                name: 'User',
                fields: [
                    { name: 'id', type: 'number', isPrimary: true, isRequired: true },
                    { name: 'firstName', type: 'string', isPrimary: false, isRequired: false }
                ]
            }
        ];

        const result = generateMarkdownDocumentation(models);

        const cleanedExpected = `
            # TypeORM Entities Documentation
            ## User
            ### id
            **Description**: The 'id' field from the User entity
            | Parameter     | Value        |
            |---------------|--------------|
            | **Type**      | number       |
            | **Required**  | Yes          |
            | **Attributes**| @primaryGeneratedColumn |
            ### firstName
            **Description**: The 'firstName' field from the User entity
            | Parameter     | Value        |
            |---------------|--------------|
            | **Type**      | string       |
            | **Required**  | No           |
            | **Attributes**| -            |
        `.replace(/\s+/g, ' ').trim();

        const cleanedResult = result.replace(/\s+/g, ' ').trim();

        expect(cleanedResult).toBe(cleanedExpected);
    });
});