package cm.kmerfret.backend.service;

import cm.kmerfret.backend.dto.request.CreateDisputeRequest;
import cm.kmerfret.backend.exception.ResourceNotFoundException;
import cm.kmerfret.backend.exception.UnauthorizedException;
import cm.kmerfret.backend.model.Mission;
import cm.kmerfret.backend.model.User;
import cm.kmerfret.backend.repository.MissionRepository;
import cm.kmerfret.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushService;

    private User currentUser() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    @Transactional
    public Map<String, Object> openDispute(CreateDisputeRequest req) {
        User requester = currentUser();
        Mission m = missionRepository.findById(req.getMissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        boolean isImporter = m.getImporter().getId().equals(requester.getId());
        boolean isDriver   = m.getDriver() != null && m.getDriver().getId().equals(requester.getId());

        if (!isImporter && !isDriver && requester.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Vous ne participez pas à cette mission");
        }

        m.setStatus(Mission.MissionStatus.DISPUTED);
        m.setPaymentStatus(Mission.PaymentStatus.DISPUTED);
        missionRepository.save(m);

        log.info("Litige ouvert — mission {} par {} ({})", m.getId(), requester.getFullName(), req.getDisputeType());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("missionId",   m.getId());
        result.put("status",      "DISPUTED");
        result.put("disputeType", req.getDisputeType());
        result.put("description", req.getDescription());
        result.put("openedBy",    requester.getFullName());
        result.put("message",     "Litige ouvert. L'équipe KmerFret vous contactera sous 24h.");
        return result;
    }

    @Transactional
    public Map<String, Object> resolveDispute(UUID missionId, String resolution) {
        User admin = currentUser();
        if (admin.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Seul un administrateur peut résoudre un litige");
        }
        Mission m = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        if ("RELEASE".equalsIgnoreCase(resolution)) {
            m.setStatus(Mission.MissionStatus.DELIVERED);
            m.setPaymentStatus(Mission.PaymentStatus.RELEASED);
        } else {
            m.setPaymentStatus(Mission.PaymentStatus.REFUNDED);
        }
        missionRepository.save(m);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("missionId",  m.getId());
        result.put("resolution", resolution);
        result.put("status",     m.getStatus().name());
        return result;
    }
}
