-- Prisma's schema language can't express CHECK constraints, so this one is written by hand.
-- Last line of defence: the database itself refuses negative stock, whatever the code does.
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_non_negative" CHECK ("stock" >= 0);
