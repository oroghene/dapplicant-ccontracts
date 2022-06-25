## LENDING WITH SBTs

1. SBTs that represent education credentials, work history, and rental contracts could serve as a persistent record of credit-relevant history, allowing Souls to stake meaningful reputation to avoid collateral requirements and secure a loan.
2. Loans and credit lines could be represented as non-transferable but revocable SBTs, so they are nested amongst a Soul’s other SBTs—a kind of non-seizable reputational collateral—until they are repaid and subsequently burned, or better yet, replaced with proof of repayment.
3. SBTs offer useful security properties: non-transferability prevents transferring or hiding outstanding loans, while a rich ecosystem of SBTs ensures that borrowers who try to escape their loans (perhaps by spinning up a fresh Soul) will lack SBTs to meaningfully stake their reputation.

## LOAN AGREEMENT CONTRACT

1. LoanApplication = {applicant, appID, loan amount, int rate, submitted time, active, repaid, amountpaid, principal}
1. add time to properties
1. calculate fixed regular payment amount (to cover principal and interest)
   6% = 0.5% a month (1 year)
   each month pay 0.5%
   percent \* principal
   at each payment, principal + interest = balance
   shorter loan = greater monthly payment
   better (lower interest rates)

1. Dynamic SVG NFT representing a loan:
1. when unpaid but still in time, yellow bg
1. when unpaid after time, red bg, -50 credit score
1. if miss a single payment, -5 credit score
1. if paid in time, green bg +20 credit score

application = {
address applicant; ✅ ❗️
uint256 applicationID; ✅ ❗️
address borrowToken; ✅ ❗️
address collateralToken; ✅ ❗️
uint256 borrowAmount; ✅ ❗️
int96 interestRate; ✅ ❗️
uint256 durationInMonths; ✅ ❗️
uint256 collateralAmount; ✅ ❗️
uint256 guarantor; ✅ ❗️
uint256 submittedTime; ✅ ❗️
ApplicationStatus status; ✅ ❗️
uint256 amountPaid; ✅ ❗️
string textHue; ✅ ❗️
string bgHue; ✅ ❗️
}
