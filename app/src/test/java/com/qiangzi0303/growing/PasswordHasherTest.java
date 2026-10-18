package com.qiangzi0303.growing;
import static org.junit.Assert.*;
import org.junit.Test;

public class PasswordHasherTest {
    @Test public void verifiesOnlyCorrectPassword() throws Exception {
        byte[] salt=new byte[16];salt[0]=42;
        byte[] hash=PasswordHasher.hash("securePass123".toCharArray(),salt,PasswordHasher.ITERATIONS);
        assertTrue(PasswordHasher.verify("securePass123".toCharArray(),salt,PasswordHasher.ITERATIONS,hash));
        assertFalse(PasswordHasher.verify("wrongPassword".toCharArray(),salt,PasswordHasher.ITERATIONS,hash));
    }
    @Test public void differentSaltChangesHash() throws Exception {
        byte[] first=new byte[16],second=new byte[16];second[0]=1;
        assertFalse(java.util.Arrays.equals(PasswordHasher.hash("securePass123".toCharArray(),first,PasswordHasher.ITERATIONS),PasswordHasher.hash("securePass123".toCharArray(),second,PasswordHasher.ITERATIONS)));
    }
}
