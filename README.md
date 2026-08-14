# 반려꾸러미 Storefront

반려동물용품 탐색, 좋아요, 주문과 데모 결제 상태 확인을 제공하는
`반려꾸러미`의 React storefront입니다. 백엔드는 독립 저장소인
[shAn-kor/banryeo-kkurumi](https://github.com/shAn-kor/banryeo-kkurumi)에서
관리합니다.

## 저장소 구성

두 저장소를 형제 디렉터리로 배치하면 로컬 E2E가 백엔드를 자동으로 찾습니다.

```text
project/
├── banryeo-kkurumi/           # Spring 백엔드
└── banryeo-kkurumi-frontend/  # React 프론트엔드
```

이 저장소의 Git 이력은 PawShop 저장소의 `apps/storefront` 경로에서 분리했습니다.
기존 PR, 리뷰와 댓글은 원본
[PawShop 저장소](https://github.com/shAn-kor/PawShop)에 남아 있습니다.

## 로컬 실행

Node.js 22와 Docker가 필요합니다. 먼저 형제 백엔드 저장소를 실행합니다.

```shell
cd ../banryeo-kkurumi
docker compose -f compose.public.yml up -d --build
```

그다음 프론트 저장소에서 의존성을 설치하고 개발 서버를 실행합니다. `/api`
요청은 기본적으로 `http://localhost:8080`으로 프록시됩니다.

```shell
npm ci
npm run dev
```

백엔드 주소가 다르면 API origin을 지정합니다.

```shell
STOREFRONT_API_ORIGIN=http://localhost:18080 npm run dev
```

## 검증

```shell
npm test
npm run build
npm run e2e:runtime:check
bash scripts/q3-runtime.test.sh
npm run e2e:live
```

`e2e:live`는 기본적으로 형제 디렉터리의 `banryeo-kkurumi`를 사용합니다. 다른
위치에서는 프로젝트 루트 또는 실제 백엔드 디렉터리를 지정할 수 있습니다.

```shell
BANRYEO_BACKEND_ROOT=/path/to/banryeo-kkurumi npm run e2e:live
```

E2E 런타임은 `banryeo-q3-e2e-*` Compose 프로젝트만 사용하며, 완료 후 해당
컨테이너와 테스트 볼륨을 정리합니다.

## 라이선스

[Apache License 2.0](LICENSE)
