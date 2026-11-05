// Synthetic local-only credentials; never use these accounts against a remote host.
export const password = 'LocalOnly_E2E_2026';
export const users = {
  admin: { id: '13000000-0000-4000-8000-000000000001', username: 'e2e_admin', displayName: '验收管理员', role: 'Parent', confirmed: 1 },
  parentA: { id: '13000000-0000-4000-8000-000000000002', username: 'e2e_parent_a', displayName: '验收家长甲', role: 'Parent', confirmed: 1 },
  parentB: { id: '13000000-0000-4000-8000-000000000003', username: 'e2e_parent_b', displayName: '验收家长乙', role: 'Parent', confirmed: 1 },
  emptyParent: { id: '13000000-0000-4000-8000-000000000004', username: 'e2e_empty', displayName: '验收无孩子家长', role: 'Parent', confirmed: 1 },
  childA: { id: '13000000-0000-4000-8000-000000000005', username: 'e2e_child_a', displayName: '验收孩子甲', role: 'Student', confirmed: 1 },
  childB: { id: '13000000-0000-4000-8000-000000000006', username: 'e2e_child_b', displayName: '验收孩子乙', role: 'Student', confirmed: 1 },
  unknown: { id: '13000000-0000-4000-8000-000000000007', username: 'e2e_unknown', displayName: '验收待确认', role: 'Student', confirmed: 0 },
  actionParent: { id: '13000000-0000-4000-8000-000000000008', username: 'e2e_action_parent', displayName: '操作验收家长', role: 'Parent', confirmed: 1 },
  actionChild: { id: '13000000-0000-4000-8000-000000000009', username: 'e2e_action_child', displayName: '操作验收孩子', role: 'Student', confirmed: 1 },
  pendingParent: { id: '13000000-0000-4000-8000-000000000010', username: 'e2e_pending_parent', displayName: '身份验收家长', role: 'Student', confirmed: 0 },
  pendingStudent: { id: '13000000-0000-4000-8000-000000000011', username: 'e2e_pending_student', displayName: '身份验收学生', role: 'Student', confirmed: 0 }
} as const;
