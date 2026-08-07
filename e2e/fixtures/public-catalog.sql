-- Deterministic Q3 browser-fixture catalog for the isolated Compose database.
-- ASCII fixture values keep the mysql CLI encoding-neutral; the schema stores
-- UUID reference ids as BINARY(16), matching the public runtime's real model.
INSERT INTO categories (
    reference_id, name, created_at, updated_at, deleted_at
) VALUES (
    UNHEX('aaaaaaaaaaaa4aaa8aaaaaaaaaaaaaaa'),
    'E2E Pet Food',
    UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), NULL
);

INSERT INTO brands (
    reference_id, name, description, image_url, created_at, updated_at, deleted_at
) VALUES (
    UNHEX('11111111111141118111111111111111'),
    'E2E-Pet-Brand',
    'Browser E2E-only public runtime brand',
    NULL,
    UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), NULL
);

INSERT INTO products (
    reference_id, name, price, stock, description,
    category_reference_id, brand_reference_id, like_count,
    created_at, updated_at, deleted_at
)
VALUES (
    UNHEX('22222222222242228222222222222222'),
    'E2E Salmon Food', 12000, 12, 'First browser E2E fixture product.',
    UNHEX('aaaaaaaaaaaa4aaa8aaaaaaaaaaaaaaa'), UNHEX('11111111111141118111111111111111'), 0,
    UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), NULL
);

INSERT INTO products (
    reference_id, name, price, stock, description,
    category_reference_id, brand_reference_id, like_count,
    created_at, updated_at, deleted_at
)
VALUES (
    UNHEX('33333333333343338333333333333333'),
    'E2E Duck Treat', 7000, 12, 'Second browser E2E fixture product.',
    UNHEX('aaaaaaaaaaaa4aaa8aaaaaaaaaaaaaaa'), UNHEX('11111111111141118111111111111111'), 0,
    UTC_TIMESTAMP(6), UTC_TIMESTAMP(6), NULL
);
