export interface MockPaymentProvider { createPayment(amount:number):Promise<{reference:string;status:"SUCCESS"}>; refundPayment(reference:string,amount:number):Promise<{reference:string;status:"REFUNDED";amount:number}> }
export const mockPaymentProvider:MockPaymentProvider={async createPayment(amount){return {reference:`mock-pay-${Date.now().toString(36)}`,status:"SUCCESS"}},async refundPayment(reference,amount){return {reference,status:"REFUNDED",amount}}};

