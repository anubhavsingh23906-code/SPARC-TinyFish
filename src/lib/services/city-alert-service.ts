import { connectDb } from "@/lib/db";
import {
  getDemandForecast,
} from "@/lib/services/demand-intelligence-service";
import {
  requireRole,
  SessionUser,
} from "@/lib/auth";

export type CityAlertSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM";

export type CityAlertType =
  | "CAPACITY_CRITICAL"
  | "CAPACITY_HIGH"
  | "DEMAND_INCREASING";

export interface CityAlert {
  id: string;
  zone: string;
  type: CityAlertType;
  severity: CityAlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  currentUtilization: number;
  predictedUtilization: number;
  confidence: number;
  createdAt: string;
}

function createAlert(
  zone: {
    zone: string;
    currentUtilization: number;
    predictedUtilization: number;
    confidence: number;
    risk: string;
    trend: string;
    recommendation: string;
  },
): CityAlert | null {
  if (zone.risk === "CRITICAL") {
    return {
      id: `${zone.zone}-CAPACITY_CRITICAL`,
      zone: zone.zone,
      type: "CAPACITY_CRITICAL",
      severity: "CRITICAL",
      title: `${zone.zone} has critical capacity pressure`,
      message:
        `Current utilization is ${zone.currentUtilization}% ` +
        `with forecast utilization at ${zone.predictedUtilization}%.`,
      recommendation:
        zone.recommendation,
      currentUtilization:
        zone.currentUtilization,
      predictedUtilization:
        zone.predictedUtilization,
      confidence: zone.confidence,
      createdAt: new Date().toISOString(),
    };
  }

  if (zone.risk === "HIGH") {
    return {
      id: `${zone.zone}-CAPACITY_HIGH`,
      zone: zone.zone,
      type: "CAPACITY_HIGH",
      severity: "HIGH",
      title: `${zone.zone} is approaching capacity`,
      message:
        `Current utilization is ${zone.currentUtilization}% ` +
        `with forecast utilization at ${zone.predictedUtilization}%.`,
      recommendation:
        zone.recommendation,
      currentUtilization:
        zone.currentUtilization,
      predictedUtilization:
        zone.predictedUtilization,
      confidence: zone.confidence,
      createdAt: new Date().toISOString(),
    };
  }

  if (
    zone.trend === "INCREASING_DEMAND" &&
    zone.confidence >= 60
  ) {
    return {
      id: `${zone.zone}-DEMAND_INCREASING`,
      zone: zone.zone,
      type: "DEMAND_INCREASING",
      severity: "MEDIUM",
      title: `Demand is increasing in ${zone.zone}`,
      message:
        `Historical snapshots indicate increasing ` +
        `demand pressure in this zone.`,
      recommendation:
        zone.recommendation,
      currentUtilization:
        zone.currentUtilization,
      predictedUtilization:
        zone.predictedUtilization,
      confidence: zone.confidence,
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export async function getCityAlerts(
  actor: SessionUser,
) {
  requireRole(actor, "CITY_OPERATOR");

  await connectDb();

  const forecast = await getDemandForecast();

  const alerts = forecast.zones
    .map((zone) =>
      createAlert({
        zone: zone.zone,
        currentUtilization:
          zone.currentUtilization,
        predictedUtilization:
          zone.predictedUtilization,
        confidence: zone.confidence,
        risk: zone.risk,
        trend: zone.trend,
        recommendation:
          zone.recommendation,
      }),
    )
    .filter(
      (
        alert,
      ): alert is CityAlert =>
        alert !== null,
    )
    .sort((a, b) => {
      const priority = {
        CRITICAL: 3,
        HIGH: 2,
        MEDIUM: 1,
      };

      return (
        priority[b.severity] -
        priority[a.severity]
      );
    });

  return {
    generatedAt:
      new Date().toISOString(),
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter(
        (alert) =>
          alert.severity === "CRITICAL",
      ).length,
      high: alerts.filter(
        (alert) =>
          alert.severity === "HIGH",
      ).length,
      medium: alerts.filter(
        (alert) =>
          alert.severity === "MEDIUM",
      ).length,
    },
  };
}