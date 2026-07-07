import { prisma } from "../config/prisma.js";
import { queryPanelMetrics } from "./search.service.js";

export const listPanels = (userId) =>
  prisma.dashboardPanel.findMany({ where: { userId }, orderBy: { position: "asc" } });

export const createPanel = async (userId, payload) => {
  const maxPanel = await prisma.dashboardPanel.findFirst({ where: { userId }, orderBy: { position: "desc" } });
  return prisma.dashboardPanel.create({
    data: {
      userId,
      title: payload.title,
      query: payload.query,
      vizType: payload.vizType,
      position: maxPanel ? maxPanel.position + 1 : 0
    }
  });
};

export const updatePanel = async (userId, id, payload) => {
  const existing = await prisma.dashboardPanel.findFirst({ where: { id, userId } });
  if (!existing) throw Object.assign(new Error("Panel not found"), { status: 404 });
  return prisma.dashboardPanel.update({
    where: { id },
    data: {
      title: payload.title,
      query: payload.query,
      vizType: payload.vizType,
      position: payload.position
    }
  });
};

export const reorderPanels = async (userId, panelIds) => {
  const tx = panelIds.map((id, idx) =>
    prisma.dashboardPanel.updateMany({ where: { id, userId }, data: { position: idx } })
  );
  await prisma.$transaction(tx);
  return listPanels(userId);
};

export const getPanelData = async (userId, panelId, from, to) => {
  const panel = await prisma.dashboardPanel.findFirst({ where: { id: panelId, userId } });
  if (!panel) throw Object.assign(new Error("Panel not found"), { status: 404 });
  const data = await queryPanelMetrics({ query: panel.query, from, to });
  return { panel, data };
};

export const listLayouts = async (userId, role, teamKey) => {
  const where = {
    OR: [
      { userId },
      { roleScope: role },
      ...(teamKey ? [{ teamScope: teamKey }] : [])
    ]
  };
  return prisma.dashboardLayout.findMany({ where, orderBy: { createdAt: "desc" } });
};

export const saveCurrentLayout = async (userId, role, payload) => {
  const panels = await listPanels(userId);
  return prisma.dashboardLayout.create({
    data: {
      userId,
      name: payload.name,
      roleScope: payload.roleScope || null,
      teamScope: payload.teamScope || null,
      panelsJson: panels.map((p) => ({ title: p.title, query: p.query, vizType: p.vizType, position: p.position }))
    }
  });
};

export const applyLayout = async (userId, role, layoutId, teamKey) => {
  const layout = await prisma.dashboardLayout.findFirst({
    where: {
      id: layoutId,
      OR: [
        { userId },
        { roleScope: role },
        ...(teamKey ? [{ teamScope: teamKey }] : [])
      ]
    }
  });

  if (!layout) throw Object.assign(new Error("Layout not found"), { status: 404 });

  const panels = Array.isArray(layout.panelsJson) ? layout.panelsJson : [];

  await prisma.$transaction([
    prisma.dashboardPanel.deleteMany({ where: { userId } }),
    ...(panels.length
      ? [
          prisma.dashboardPanel.createMany({
            data: panels.map((p, idx) => ({
              userId,
              title: p.title,
              query: p.query,
              vizType: p.vizType,
              position: idx
            }))
          })
        ]
      : [])
  ]);

  return listPanels(userId);
};
