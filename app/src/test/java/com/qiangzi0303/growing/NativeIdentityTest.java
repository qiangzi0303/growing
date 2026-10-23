package com.qiangzi0303.growing;

import static org.junit.Assert.*;
import org.json.JSONObject;
import org.junit.Test;

public class NativeIdentityTest {
    private static final String ID="00000000-0000-4000-8000-000000000001";
    private JSONObject profile(String role) throws Exception { return new JSONObject().put("id",ID).put("role",role); }
    @Test public void defaultStudentWithoutExplicitConfirmationNeverUnlocksNativeApp() throws Exception {
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Student")));
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Student").put("roleSelectionRequired",true)));
    }
    @Test public void bothUserSelectedRolesCanBeCachedOnlyAfterCloudConfirmation() throws Exception {
        for(String role:new String[]{"Student","Parent"}){
            NativeIdentity identity=new NativeIdentity(profile(role).put("roleSelectionRequired",false));
            assertEquals(role,identity.role);assertEquals(ID,identity.id);
            assertEquals(role,new NativeIdentity(new JSONObject(identity.json())).role);
        }
    }
    @Test public void pendingParentCannotUnlock() throws Exception {
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Parent").put("roleSelectionRequired",true)));
    }
    @Test public void malformedConfirmationDoesNotUnlock() throws Exception {
        for(Object value:new Object[]{"false",0,JSONObject.NULL})
            assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Student").put("roleSelectionRequired",value)));
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Unknown").put("roleSelectionRequired",false)));
    }
    @Test public void rejectsInvalidCloudId() throws Exception {
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Student").put("roleSelectionRequired",false).put("id","1-1-1-1-1")));
    }
    @Test public void cloudAdministratorNeedsNoStudentParentSelection() throws Exception {
        assertEquals("Admin",new NativeIdentity(profile("Admin")).role);
    }
    @Test public void repeatedConfirmationIsIdempotentButCannotChangeAccountOrRole() throws Exception {
        NativeIdentity previous=new NativeIdentity(profile("Student").put("roleSelectionRequired",false));
        new NativeIdentity(new JSONObject(previous.json())).requireSameAccount(previous);
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Parent").put("roleSelectionRequired",false)).requireSameAccount(previous));
        assertThrows(IllegalArgumentException.class,()->new NativeIdentity(profile("Student").put("roleSelectionRequired",false).put("id","00000000-0000-4000-8000-000000000002")).requireSameAccount(previous));
    }
}
