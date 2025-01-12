import { Neo4jClient } from './driver';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const db = new Neo4jClient();

export interface CreateUserInput {
    email: string;
    password: string;
    name?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export const userRepository = {
    async createUser(input: CreateUserInput): Promise<User> {
        await db.connect();

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const now = new Date();

        const result = await db.executeWrite(
            `
      CREATE (u:User {
        id: $id,
        email: $email,
        password: $password,
        name: $name,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN u
      `,
            {
                id: uuidv4(),
                email: input.email,
                password: hashedPassword,
                name: input.name || null,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            }
        );

        const user = result[0].u.properties;
        return {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
        };
    },

    async findByEmail(email: string): Promise<User | null> {
        await db.connect();

        const result = await db.executeQuery(
            `
      MATCH (u:User {email: $email})
      RETURN u
      `,
            { email }
        );

        if (result.length === 0) return null;

        const user = result[0].u.properties;
        return {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
        };
    },

    async findById(id: string): Promise<User | null> {
        await db.connect();

        const result = await db.executeQuery(
            `
      MATCH (u:User {id: $id})
      RETURN u
      `,
            { id }
        );

        if (result.length === 0) return null;

        const user = result[0].u.properties;
        return {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
        };
    },
};
