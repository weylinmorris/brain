import { NextResponse } from 'next/server';
import { userRepository } from '@/db/neo4j/userRepository';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Create new user
        const user = await userRepository.createUser({
            email,
            password,
            name,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
