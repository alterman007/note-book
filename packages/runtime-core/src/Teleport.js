function resolveTarget(to) {
  return typeof to === 'string' ? document.querySelector(to) : to;
}
// prettier-ignore
export const MyTeleport = {
  name: 'MyTeleport',
  __isTeleport: true, // 伪装 Teleport 组件
  process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals) {
    const { 
      mc: mountChildren,
      pc: patchChildren,
      m: move,
    } = internals;
    if (n1 == null) {
      const target = resolveTarget(n2.props?.to);
      n2.target = target;
      if (target) {
        mountChildren(
          n2.children,
          target, // 目标容器
          anchor, // 目标锚点
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
        )
      }
    } else {
      // 更新子节点
      patchChildren(
        n1,
        n2,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        false,
      )
      // 移动节点
      if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
        const target = resolveTarget(n2.props?.to);
        n2.target = target;
        if (target) {
          for (let i = 0; i < n2.children.length; i++) {
            const child = n2.children[i];
            move(child, target, null, 3);
          }
        }
      }
    }
  },
  remove(vnode, parentComponent, parentSuspense, internals, doRemove) {
    const { um: unmount } = internals;
    const { children } = vnode;
    if (doRemove) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        unmount(
          child,
          parentComponent,
          parentSuspense,
          doRemove,
          !!child.dynamicChildren,
        )
      }
    }
  },
  move(vnode, container, parentAnchor, internals, moveType) {},
};
