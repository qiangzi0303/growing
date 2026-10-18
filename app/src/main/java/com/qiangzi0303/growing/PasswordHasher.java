package com.qiangzi0303.growing;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class PasswordHasher {
    public static final int ITERATIONS = 210_000;
    private PasswordHasher() {}
    public static byte[] hash(char[] password, byte[] salt, int iterations) throws GeneralSecurityException {
        if (salt.length < 16 || iterations < 100_000) throw new IllegalArgumentException("Invalid password parameters");
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, 256);
        try { return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(); }
        finally { spec.clearPassword(); }
    }
    public static boolean verify(char[] password, byte[] salt, int iterations, byte[] expected) throws GeneralSecurityException {
        return MessageDigest.isEqual(hash(password, salt, iterations), expected);
    }
}
